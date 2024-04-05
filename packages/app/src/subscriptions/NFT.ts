/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
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
  Atom,
  AtomType,
} from "@app/types";
import { ElectrumTxMap, buildUpdateTXOs } from "./buildUpdateTXOs";
import db from "@app/db";
import Outpoint from "@lib/Outpoint";
import {
  decodeAtom,
  filterArgs,
  filterAttrs,
  isImmutableToken,
} from "@lib/atom";
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
  protected updateTXOs: ElectrumStatusUpdate;
  protected electrum: ElectrumManager;

  constructor(electrum: ElectrumManager) {
    this.electrum = electrum;
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.NFT);
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

        const refs = added
          .map((txo) => {
            const { ref } = parseNftScript(txo.script);
            return (
              ref && {
                ref: Outpoint.fromString(ref).reverse().ref(),
                txo,
              }
            );
          })
          .filter(Boolean) as { ref: string; txo: TxO }[];

        const { received, related } = await this.addTokens(refs, newTxs || {});
        this.addRelated(related);

        // Update any NFTs that have been transferred
        await db.transaction("rw", db.atom, async () => {
          for (const lastTxo of spent) {
            await db.atom.where({ lastTxoId: lastTxo.id }).modify({ spent: 1 });
          }
        });

        // Update heights
        await db.transaction("rw", db.atom, async () => {
          for (const [lastTxoId, conf] of confs) {
            await db.atom
              .where({ lastTxoId })
              .modify({ height: conf.height || Infinity });
          }
        });

        const limited = received.length > 11 ? received.slice(0, 10) : received;
        limited.forEach(({ atom }) => {
          toast({
            title: t`Received token: ${
              atom.name || Outpoint.fromString(atom.ref).shortAtom()
            }`,
          });
        });

        if (received.length > 11) {
          toast({
            title: t`Received ${received.length - 10} more digital objects`,
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

              // Also save delegates so we don't need to look for them again later in saveAtom
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
            // FIXME should this use txid instead of ref?
            const refBE = Outpoint.fromString(delegateRef).reverse();
            let hex = await opfs.getTx(refBE.toString());

            // Fetch
            if (!hex) {
              hex = (await this.electrum.client?.request(
                "blockchain.transaction.get",
                refBE.getTxid()
              )) as string;
              // Store in cache
              hex && (await opfs.putTx(refBE.toString(), hex));
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

    const received: { atom: Atom; value: number }[] = [];
    const relatedArrs = await Promise.all(
      refs.map(async ({ ref, txo }) => {
        const delegatedRefs = revealTxs[refReveals[ref]].delegates.flatMap(
          (r) => delegateRefMap[r]
        );
        const { related, valid, atom } = await this.saveAtom(
          ref,
          txo,
          revealTxs[refReveals[ref]].tx,
          delegatedRefs,
          fresh.includes(ref)
        );
        if (valid && txo && atom) received.push({ atom, value: txo.value });
        return related;
      })
    );

    // Flatten and dedup related arrays
    const related = Array.from(new Set(relatedArrs.flat()));

    return { received, related };
  }

  async fetchRefMint(ref: string): Promise<string> {
    const result = (await this.electrum.client?.request(
      "blockchain.ref.get",
      ref
    )) as SingletonGetResponse;
    console.debug("ref.get", ref, result);
    return result.length ? result[0].tx_hash : "";
  }

  // Decode an Atom token and save to the database. Return the name so the user can be notified
  async saveAtom(
    ref: string,
    receivedTxo: TxO | undefined, // Received txo can be undefined when token is an author or container dependency
    reveal: Transaction,
    delegatedRefs: string[],
    fresh: boolean
  ): Promise<{ related: string[]; valid?: boolean; atom?: Atom }> {
    const refTxId = ref.substring(0, 64);
    const refVout = parseInt(ref.substring(64), 10);

    // Find token script in the reveal tx
    const revealIndex = reveal.inputs.findIndex((input) => {
      return (
        input.prevTxId.toString("hex") === refTxId &&
        input.outputIndex === refVout
      );
    });
    const script = revealIndex >= 0 && reveal.inputs[revealIndex].script;

    if (!script) return { related: [] };

    const atom = decodeAtom(script);
    if (!atom) {
      // Unrecognised token
      console.info("Unrecognised token");
      return { related: [] };
    }

    const related: string[] = [];
    const { payload, files, operation } = atom;
    const { in: containers, by: authors } = payload;
    // Map atom operation (ft, nft, dat) to enum
    const atomType = AtomType[operation.toUpperCase() as keyof typeof AtomType];

    console.debug("Atom payload", payload);

    // Look for related tokens in outputs
    const outputTokens = reveal.outputs
      .map((o) => parseNftScript(o.script.toHex()).ref) // TODO handle FT, dat
      .filter(Boolean) as string[];
    // Validate any author and container properties
    const allRefs = [...delegatedRefs, ...outputTokens];
    console.debug("All related refs", allRefs);
    const container = containers ? filterRels(containers, allRefs)[0] : "";
    const author = authors ? filterRels(authors, allRefs)[0] : "";

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
    const existing = await db.atom.get({ ref });

    // Will replace if ref exists
    // TODO keep modify history
    const name = toString(payload.name);
    const record: Atom = {
      ref,
      atomType,
      lastTxoId: receivedTxo?.id,
      revealOutpoint: Outpoint.fromUTXO(reveal.id, revealIndex).toString(),
      spent: 0,
      fresh: fresh ? 1 : 0,
      type,
      immutable,
      name,
      description: toString(payload.desc),
      author,
      container,
      attrs: filterAttrs(payload.attrs),
      args: filterArgs(payload.args),
      fileSrc: fileSrc || undefined,
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
      db.atom.update(existing.id, record);
    } else {
      console.log(`Put ${ref}`);
      db.atom.put(record);
    }

    return {
      related,
      valid: true,
      atom: record,
    };
  }

  async addRelated(related: string[]) {
    // Check if there are any new related tokens to fetch
    const newRelated = (
      await Promise.all(
        related.map(async (ref) =>
          (await db.atom.get({ ref })) ? undefined : ref
        )
      )
    ).filter(Boolean) as string[];

    // Fetch containers and authors
    if (newRelated.length > 0) {
      console.debug("Fetching related", newRelated);
      console.debug(`Existing related: ${related.length - newRelated.length}`);

      // Fetch new related tokens. A TxO is not needed for these since they are not owned by this user
      // Only an atom record is needed for displaying the author and container names
      const relatedRefs = newRelated.map((ref) => ({ ref }));

      await this.addTokens(relatedRefs);
    }
  }
}
