/* eslint-disable @typescript-eslint/ban-ts-comment */
import { parseCommitScript, nftScriptHash } from "@lib/script";
import {
  Subscription,
  ContractType,
  ElectrumCallback,
  ElectrumStatusUpdate,
  ElectrumTxResponse,
  TxO,
  Utxo,
  AtomNft,
} from "@app/types";
import { ElectrumTxMap, buildUpdateTXOs } from "./buildUpdateTXOs";
import db from "@app/db";
import Outpoint from "@lib/Outpoint";
import { decodeAtom } from "@lib/atom";
import {
  Transaction,
  Script,
  // @ts-ignore
} from "@radiantblockchain/radiantjs";
import ElectrumManager from "@app/electrum/ElectrumManager";

type TxIdHeight = {
  tx_hash: string;
  height: number;
};
type SingletonGetResponse = [TxIdHeight, TxIdHeight];

const toString = (str: unknown) => (typeof str === "string" ? str : "");

const decoder = new TextDecoder("utf-8");
const filterRels = (reveal: unknown[], commit: string[]) =>
  (reveal as Uint8Array[])
    .filter((rel) => rel instanceof Uint8Array)
    .map((rel) => decoder.decode(rel))
    .filter((rel) => commit.includes(rel));

export class NFTSubscription implements Subscription {
  private updateTXOs: ElectrumStatusUpdate;
  private electrum: ElectrumManager;

  constructor(electrum: ElectrumManager) {
    this.electrum = electrum;
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.NFT);
  }

  onReceived(
    txos: TxO[],
    confs: Map<number, Utxo>,
    txMap: ElectrumTxMap,
    spent: number[] = []
  ) {
    // Get mint tx
    txos.map(async (txo) => {
      const ref = Outpoint.fromString(txo.script.substring(2, 74))
        .reverse()
        .ref();
      const refTxId = ref.substring(0, 64);
      const refVout = parseInt(ref.substring(64), 10);
      console.debug(`Fetching singleton for ${ref}`);
      const result = (await this.electrum.client?.request(
        "blockchain.ref.get",
        ref
      )) as SingletonGetResponse;
      console.debug("ref.get", ref, result);
      const txid = result.length && result[0].tx_hash;
      let script: Script = Script.empty();
      const fresh = txid === txo.txid;
      if (fresh) {
        // UTXO is from the mint tx, look it up in the map returned from updateTXOs
        if (txMap) {
          script = txMap[txid].tx.inputs[txo.vout].script;
          console.debug("Token is in mint tx");
        } else {
          console.debug("No tx map");
        }
      } else if (txid) {
        console.debug("Fetching mint tx");
        // Get the mint tx
        const hex = await this.electrum.client?.request(
          "blockchain.transaction.get",
          txid
        );
        const tx = new Transaction(hex);
        // @ts-ignore
        const refInput = tx.inputs.find((input) => {
          return (
            input.prevTxId.toString("hex") === refTxId &&
            input.outputIndex === refVout
          );
        });
        if (!refInput?.script) {
          console.debug("Script not found", refInput, hex);
          return;
        }
        script = refInput?.script as Script;
      } else {
        return;
      }
      if (script) {
        const atom = decodeAtom(script);
        if (atom) {
          const { payload, files } = atom;
          console.debug(`Atom payload found for ${txo.txid}:${txo.vout}`);
          console.debug("Atom script", script.toString());

          // Get the commit tx to check the commit script and find the author
          const commitRefs = await this.fetchCommit(refTxId, refVout);

          const { meta, in: containers, by: authors } = payload;
          const attrs =
            typeof meta.attrs === "object" ? (meta.attrs as object) : {};
          const main = toString(meta.main) || undefined;
          const type = toString(meta.type) || "object";
          const file =
            main && files[main] instanceof Uint8Array ? files[main] : undefined;
          const hashstamp =
            files["hs.webp"] instanceof Uint8Array
              ? files["hs.webp"]
              : undefined;

          // Validate any author and container properties
          const container = filterRels(containers, commitRefs)[0];
          const author = filterRels(authors, commitRefs)[0];

          // Check if token already exists
          const existing = await db.atomNft.get({ ref });

          // Will replace if ref exists
          // TODO keep modify history
          const record: AtomNft = {
            ref,
            lastTxoId: txo.id,
            spent: 0,
            fresh: fresh ? 1 : 0,
            main,
            type,
            name: toString(meta.name),
            description: toString(meta.desc),
            author,
            container,
            attrs: Object.fromEntries(
              Object.entries(attrs).filter(
                ([, value]) => typeof value === "string"
              )
            ),
            file: file ? (file as ArrayBuffer) : undefined,
            filename: file ? main : undefined,
            hash: meta.hash as ArrayBuffer,
            hashstamp: hashstamp ? (hashstamp as ArrayBuffer) : undefined,
            height: txo.height || Infinity,
          };

          if (existing?.id) {
            db.atomNft.update(existing.id, record);
          } else {
            db.atomNft.put(record);
          }
        } else {
          // Unrecognised token
          console.debug("Unrecognised token");
        }
      }
    });

    // Update any NFTs that have been transferred
    db.transaction("rw", db.atomNft, async () => {
      for (const lastTxoId of spent) {
        await db.atomNft.where({ lastTxoId }).modify({ spent: 1 });
      }
    });

    // Update heights
    db.transaction("rw", db.atomNft, async () => {
      for (const [lastTxoId, conf] of confs) {
        await db.atomNft
          .where({ lastTxoId })
          .modify({ height: conf.height || Infinity });
      }
    });

    return txos;
  }

  async fetchCommit(txid: string, vout: number) {
    console.debug(`Fetching commit tx for ${txid} ${vout}`);
    const commitRaw = (await this.electrum.client?.request(
      "blockchain.transaction.get",
      txid,
      true
    )) as ElectrumTxResponse;
    if (commitRaw) {
      const commitTx = new Transaction(commitRaw.hex);
      const commitScript = commitTx.outputs[vout].script;
      return parseCommitScript(commitScript.toHex());
    }
    return [];
  }

  async register(address: string) {
    const scriptHash = nftScriptHash(address as string);

    // Create status record if it doesn't exist
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
        this.onReceived(added, confs, newTxs || {}, spent);
        const balance = await this.electrum.client?.request(
          "blockchain.scripthash.get_balance",
          scriptHash
        );
        db.subscriptionStatus.update(scriptHash, { balance });
      }) as ElectrumCallback,
      scriptHash
    );
  }
}
