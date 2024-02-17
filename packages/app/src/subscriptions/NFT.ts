/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  parseCommitScript,
  nftScriptHash,
  parseDelegateBurnScript,
  parseDelegateBaseScript,
  parseNftScript,
} from "@lib/script";
import {
  Subscription,
  ContractType,
  ElectrumCallback,
  ElectrumStatusUpdate,
  TxO,
  AtomNft,
} from "@app/types";
import { ElectrumTxMap, buildUpdateTXOs } from "./buildUpdateTXOs";
import db from "@app/db";
import Outpoint from "@lib/Outpoint";
import { decodeAtom, isImmutableToken } from "@lib/atom";
import {
  Transaction,
  // @ts-ignore
} from "@radiantblockchain/radiantjs";
import { bytesToHex } from "@noble/hashes/utils";
import ElectrumManager from "@app/electrum/ElectrumManager";
import opfs from "@app/opfs";
import { CreateToastFnReturn } from "@chakra-ui/react";
import { t } from "@lingui/macro";

// 500KB size limit
const fileSizeLimit = 500_000;

type TxIdHeight = {
  tx_hash: string;
  height: number;
};
type SingletonGetResponse = [TxIdHeight, TxIdHeight];

const toString = (str: unknown) => (typeof str === "string" ? str : "");

const filterRels = (reveal: Uint8Array[], commit: string[]) =>
  (reveal as Uint8Array[])
    .filter((rel) => rel instanceof Uint8Array)
    .map((rel) => bytesToHex(rel))
    .filter((rel) => commit.includes(rel))
    .map((rel) => Outpoint.fromString(rel).reverse().ref());

export class NFTSubscription implements Subscription {
  private updateTXOs: ElectrumStatusUpdate;
  private electrum: ElectrumManager;

  constructor(electrum: ElectrumManager) {
    this.electrum = electrum;
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.NFT);
  }

  // TODO this needs to be refactored to use a queue that can be resumed after failure
  // This will be a first step towards moving this to a worker
  async addTokens(
    refs: { ref: string; txo?: TxO }[],
    txMap: ElectrumTxMap = {}
  ) {
    // Create an array of freshly minted refs
    const fresh = refs
      .map(({ ref, txo }) => {
        return txo?.txid &&
          txMap[txo.txid]?.tx.inputs.some(
            (input) =>
              bytesToHex(input.prevTxId) === ref.substring(0, 64) &&
              input.outputIndex === parseInt(ref.substring(65), 10)
          )
          ? ref
          : undefined;
      })
      .filter(Boolean);

    // Get reveal transaction ids for all tokens
    // Reveal txids indexed by ref
    const refReveals = Object.fromEntries(
      await Promise.all(
        refs.map(async ({ ref, txo }) => {
          // Check if an input matches the ref. This will be a mint tx.
          if (fresh.includes(ref) && txo) {
            console.debug(`Ref ${ref} is fresh`);
            // Freshly minted, we already have the reveal tx
            return [ref, txo.txid];
          }

          return [ref, await this.fetchRefMint(ref)];
        })
      )
    );

    // Dedup reveal txids
    const revealTxIds = Array.from(
      new Set(Object.values(refReveals) as string[])
    );
    console.log("Reveals", revealTxIds);
    const foundDelegates = new Set<string>();

    // Fetch reveals, object is indexed by txid
    const revealTxs = Object.fromEntries(
      (
        await Promise.all(
          revealTxIds.map(async (revealTxId) => {
            // Check if it's cached
            let hex = await opfs.getTx(revealTxId);

            if (!hex) {
              hex =
                txMap[revealTxId]?.hex ||
                ((await this.electrum.client?.request(
                  "blockchain.transaction.get",
                  revealTxId
                )) as string);

              // Store in cache
              await opfs.putTx(revealTxId, hex);
            }

            if (hex) {
              const tx = new Transaction(hex);

              // Look for delegate burn
              const delegates = tx.outputs
                .map((o) => parseDelegateBurnScript(o.script.toHex()) as string)
                .filter(Boolean);
              delegates.length && console.debug(`Found delegates`, delegates);
              delegates.forEach(foundDelegates.add, foundDelegates);

              // Also save delegates so we don't need to look for them again later in saveNft
              return [revealTxId, { tx, delegates }];
            }

            console.warn("Reveal tx not found", revealTxId);
            return undefined;
          })
        )
      ).filter(Boolean) as [string, { tx: Transaction; delegates: string[] }][]
    );

    // Fetch any delegate refs that were found
    // foundDelegates is deduped so Promise.all can be used
    const delegateRefMap = Object.fromEntries(
      (
        await Promise.all(
          Array.from(foundDelegates).map(async (delegateRef) => {
            // Check if it's cached
            let hex = await opfs.getTx(delegateRef);
            const refBE = Outpoint.fromString(delegateRef).reverse();

            // Fetch
            if (!hex) {
              hex = (await this.electrum.client?.request(
                "blockchain.transaction.get",
                refBE.getTxid()
              )) as string;
              // Store in cache
              hex && (await opfs.putTx(delegateRef, hex));
            }

            if (hex) {
              const tx = new Transaction(hex);
              const requiredRefs = parseDelegateBaseScript(
                tx.outputs[refBE.getVout()].script.toHex()
              );
              if (requiredRefs.length) {
                return [delegateRef, requiredRefs];
              }
            }

            return undefined;
          })
        )
      ).filter(Boolean) as [string, string[]][]
    );

    Object.keys(delegateRefMap).length &&
      console.debug("Delegate refs", delegateRefMap);

    const received: [string, string][] = [];
    const relatedArrs = await Promise.all(
      refs.map(async ({ ref, txo }) => {
        const delegatedRefs = revealTxs[refReveals[ref]].delegates.flatMap(
          (r) => delegateRefMap[r]
        );
        const { related, valid, name } = await this.saveNft(
          ref,
          txo,
          revealTxs[refReveals[ref]].tx,
          delegatedRefs,
          fresh.includes(ref)
        );
        if (valid) received.push([ref, name || ""]);
        return related;
      })
    );

    // Flatten and dedup related arrays
    const related = Array.from(new Set(relatedArrs.flat()));

    return { received, related };
  }

  async register(address: string, toast: CreateToastFnReturn) {
    const scriptHash = nftScriptHash(address as string);

    // create status record if it doesn't exist
    if (!(await db.subscriptionStatus.get(scriptHash))) {
      db.subscriptionStatus.put({ scriptHash, status: "" });
    }

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      (async (scriptHash: string, newStatus: string) => {
        const { added, confs, newTxs, spent } = await this.updateTXOs(
          scriptHash,
          newStatus
        );

        const refs = added.map((txo) => ({
          ref: Outpoint.fromString(txo.script.substring(2, 74)).reverse().ref(),
          txo,
        }));

        const { received, related } = await this.addTokens(refs, newTxs || {});

        // Check if there are any new related tokens to fetch
        const newRelated = (
          await Promise.all(
            related.map(async (ref) =>
              (await db.atomNft.get({ ref })) ? undefined : ref
            )
          )
        ).filter(Boolean) as string[];

        // Fetch containers and authors
        if (newRelated.length > 0) {
          console.debug("Fetching related", newRelated);
          console.debug(
            `Existing related: ${related.length - newRelated.length}`
          );

          // Fetch new related tokens. A TxO is not needed for these since they are not owned by this user
          // Only an atom record is needed for displaying the author and container names
          const relatedRefs = newRelated.map((ref) => ({ ref }));

          await this.addTokens(relatedRefs);
        }

        // Update any NFTs that have been transferred
        await db.transaction("rw", db.atomNft, async () => {
          for (const lastTxo of spent) {
            await db.atomNft
              .where({ lastTxoId: lastTxo.id })
              .modify({ spent: 1 });
          }
        });

        // Update heights
        await db.transaction("rw", db.atomNft, async () => {
          for (const [lastTxoId, conf] of confs) {
            await db.atomNft
              .where({ lastTxoId })
              .modify({ height: conf.height || Infinity });
          }
        });

        if (received.length === 1) {
          const [tokenRef, tokenName] = received[0];
          toast({
            title: t`Received token: ${tokenName || tokenRef}`,
          });
        } else if (received.length > 1) {
          toast({
            title: t`Received ${received.length} tokens`,
          });
        }

        // TODO is this needed?
        const balance = await this.electrum.client?.request(
          "blockchain.scripthash.get_balance",
          scriptHash
        );
        db.subscriptionStatus.update(scriptHash, { balance });
      }) as ElectrumCallback,
      scriptHash
    );
  }

  async fetchRefMint(ref: string): Promise<string> {
    const result = (await this.electrum.client?.request(
      "blockchain.ref.get",
      ref
    )) as SingletonGetResponse;
    console.debug("ref.get", ref, result);
    return result.length ? result[0].tx_hash : "";
  }

  // Decode an NFT and save to the database. Return the name so the user can be notified
  async saveNft(
    ref: string,
    receivedTxo: TxO | undefined, // Received txo can be undefined when token is an author or container dependency
    reveal: Transaction,
    delegatedRefs: string[],
    fresh: boolean
  ): Promise<{ related: string[]; valid?: boolean; name?: string }> {
    const refTxId = ref.substring(0, 64);
    const refVout = parseInt(ref.substring(64), 10);

    // Find NFT script in the reveal tx
    const script = reveal.inputs.find((input) => {
      return (
        input.prevTxId.toString("hex") === refTxId &&
        input.outputIndex === refVout
      );
    })?.script;

    if (!script) return { related: [] };

    const atom = decodeAtom(script);
    if (!atom) {
      // Unrecognised token
      console.info("Unrecognised token");
      return { related: [] };
    }

    const related: string[] = [];
    const { payload, files } = atom;
    const { in: containers, by: authors } = payload;

    console.debug("Atom payload", payload);

    // Look for related tokens in outputs
    const outputTokens = reveal.outputs
      .map((o) => parseNftScript(o.script.toHex()).ref)
      .filter(Boolean) as string[];
    // Validate any author and container properties
    const allRefs = [...delegatedRefs, ...outputTokens];
    console.debug("All related refs", allRefs);
    const container = containers ? filterRels(containers, allRefs)[0] : "";
    const author = authors ? filterRels(authors, allRefs)[0] : "";

    const attrs =
      typeof payload.attrs === "object" ? (payload.attrs as object) : {};
    const type = toString(payload.type) || "object";
    const immutable = isImmutableToken(payload);

    const [filename, file] = Object.entries(files)[0] || [];

    const {
      hs: hashstamp,
      h: hash,
      src: fileSrc,
    } = file instanceof Uint8Array || typeof file !== "object"
      ? { hs: undefined, h: undefined, src: undefined }
      : file;

    // Containers and authors will be fetched later
    if (container) related.push(container);
    if (author) related.push(author);

    console.debug(`Container ${container}`);
    console.debug(`Author ${author}`);

    // Check if token already exists
    const existing = await db.atomNft.get({ ref });

    // Will replace if ref exists
    // TODO keep modify history
    const name = toString(payload.name);
    const record: AtomNft = {
      ref,
      lastTxoId: receivedTxo?.id,
      spent: 0,
      fresh: fresh ? 1 : 0,
      type,
      immutable,
      name,
      description: toString(payload.desc),
      author,
      container,
      attrs: Object.fromEntries(
        Object.entries(attrs).filter(
          ([, value]) => typeof value === "string" || typeof value === "number"
        )
      ),
      main: fileSrc || undefined,
      // TODO store files in OPFS instead of IndexedDB
      file:
        file instanceof Uint8Array && file.length < fileSizeLimit
          ? file
          : undefined,
      filename: toString(filename),
      hash,
      hashstamp,
      height: receivedTxo?.height || Infinity,
    };

    if (existing?.id) {
      console.log(`Updated ${ref}`);
      db.atomNft.update(existing.id, record);
    } else {
      console.log(`Put ${ref}`);
      db.atomNft.put(record);
    }

    return { related, valid: true, name };
  }
}
