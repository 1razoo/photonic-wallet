import { SmartToken, ContractType, ElectrumCallback, TxO } from "@app/types";
import { NFTWorker } from "./NFT";
import { buildUpdateTXOs } from "./updateTxos";
import ElectrumManager from "@app/electrum/ElectrumManager";
import { ftScript, ftScriptHash, parseFtScript } from "@lib/script";
import db from "@app/db";
import Outpoint, { reverseRef } from "@lib/Outpoint";
import setSubscriptionStatus from "./setSubscriptionStatus";
import { Worker } from "./electrumWorker";

export class FTWorker extends NFTWorker {
  protected ready = true;
  protected receivedStatuses: string[] = [];
  protected address = "";

  constructor(worker: Worker, electrum: ElectrumManager) {
    super(worker, electrum);
    this.updateTXOs = buildUpdateTXOs(
      this.electrum,
      ContractType.FT,
      (utxo) => {
        const ref = Outpoint.fromShortInput(utxo.refs?.[0]?.ref)
          .reverse()
          .toString();
        if (!ref) return undefined;
        return ftScript(this.address, ref);
      }
    );
  }

  async onSubscriptionReceived(scriptHash: string, status: string) {
    // Same subscription can be returned twice
    if (status === this.lastReceivedStatus) {
      console.debug("Duplicate subscription received", status);
      return;
    }

    if (
      !this.ready ||
      !this.worker.active ||
      (await db.kvp.get("consolidationRequired"))
    ) {
      this.receivedStatuses.push(status);
      return;
    }

    this.ready = false;
    this.lastReceivedStatus = status;

    const { added, spent, utxoCount } = await this.updateTXOs(
      scriptHash,
      status
    );

    // TODO there is some duplication in NFT and FT classes

    const existingRefs: { [key: string]: SmartToken } = {};
    const newRefs: { [key: string]: TxO } = {};
    const scriptRefMap: { [key: string]: string } = {};
    for (const txo of added) {
      const { ref: refLE } = parseFtScript(txo.script);
      if (!refLE) continue;
      const ref = reverseRef(refLE);
      scriptRefMap[txo.script] = ref;
      const glyph = ref && (await db.glyph.get({ ref }));
      if (glyph) {
        existingRefs[ref] = glyph;
      } else {
        newRefs[ref] = txo;
      }
    }

    const { related, accepted } = await this.addTokens(newRefs);
    this.addRelated(related);

    // All glyphs should now be in the database. Insert txos.
    await db.transaction("rw", db.txo, db.glyph, async () => {
      const ids = (await db.txo.bulkPut(added, undefined, {
        allKeys: true,
      })) as number[];
      await Promise.all(
        added.map(async (txo, index) => {
          const ref = scriptRefMap[txo.script];
          const glyph = existingRefs[ref] || accepted[ref];
          if (glyph) {
            glyph.lastTxoId = ids[index];
            glyph.spent = 0;
            await db.glyph.put(glyph);
          }
        })
      );
    });

    const touched = new Set([
      ...added.map(({ script }) => script),
      ...spent.map(({ script }) => script),
    ]);

    // Update balances
    for (const script of touched) {
      let confirmed = 0;
      let unconfirmed = 0;
      await db.txo.where({ script, spent: 0 }).each(({ height, value }) => {
        if (height === Infinity) {
          unconfirmed += value;
        } else {
          confirmed += value;
        }
      });
      const { ref } = parseFtScript(script);
      db.balance.put({
        id: reverseRef(ref as string),
        confirmed,
        unconfirmed,
      });
    }

    setSubscriptionStatus(scriptHash, status, ContractType.FT);
    this.ready = true;
    if (this.receivedStatuses.length > 0) {
      const lastStatus = this.receivedStatuses.pop();
      this.receivedStatuses = [];
      if (lastStatus) {
        this.onSubscriptionReceived(scriptHash, lastStatus);
      }
    }

    // Check if consolidation is required
    let consolidationRequired = false;
    if (utxoCount && utxoCount > 20) {
      (
        await db.txo
          .where({
            contractType: ContractType.FT,
            spent: 0,
          })
          .toArray()
      ).reduce((acc, cur) => {
        if (!acc[cur.script]) {
          acc[cur.script] = 0;
        }
        acc[cur.script] += 1;
        if (acc[cur.script] > 10) {
          consolidationRequired = true;
        }
        return acc;
      }, {} as { [key: string]: number });
    }

    if (consolidationRequired) {
      db.kvp.put(true, "consolidationRequired");
    }
  }

  async register(address: string) {
    this.scriptHash = ftScriptHash(address as string);
    this.address = address;

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      this.onSubscriptionReceived.bind(this) as ElectrumCallback,
      this.scriptHash
    );
  }
}
