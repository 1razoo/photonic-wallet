import { Atom, ContractType, ElectrumCallback, TxO } from "@app/types";
import { NFTWorker } from "./NFT";
import { buildUpdateTXOs } from "./updateTxos";
import ElectrumManager from "@app/electrum/ElectrumManager";
import { ftScriptHash, parseFtScript } from "@lib/script";
import db from "@app/db";
import { reverseRef } from "@lib/Outpoint";
import setSubscriptionStatus from "./setSubscriptionStatus";

export class FTWorker extends NFTWorker {
  constructor(electrum: ElectrumManager) {
    super(electrum);
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.FT);
  }

  async register(address: string) {
    const scriptHash = ftScriptHash(address as string);

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      (async (scriptHash: string, status: string) => {
        // Same subscription can be returned twice
        if (status === this.lastReceivedStatus) {
          console.debug("Duplicate subscription received", status);
          return;
        }
        this.lastReceivedStatus = status;

        const { added, newTxs, spent } = await this.updateTXOs(
          scriptHash,
          status
        );

        // TODO there is some duplication in NFT and FT classes

        const existingRefs: { [key: string]: Atom } = {};
        const newRefs: { [key: string]: TxO } = {};
        const scriptRefMap: { [key: string]: string } = {};
        for (const txo of added) {
          const { ref: refLE } = parseFtScript(txo.script);
          if (!refLE) continue;
          const ref = reverseRef(refLE);
          scriptRefMap[txo.script] = ref;
          const atom = ref && (await db.atom.get({ ref }));
          if (atom) {
            existingRefs[ref] = atom;
          } else {
            newRefs[ref] = txo;
          }
        }

        const { related, accepted } = await this.addTokens(
          newRefs,
          newTxs || {}
        );
        this.addRelated(related);

        // All atoms should now be in the database. Insert txos.
        await db.transaction("rw", db.txo, db.atom, async () => {
          const ids = (await db.txo.bulkPut(added, undefined, {
            allKeys: true,
          })) as number[];
          await Promise.all(
            added.map(async (txo, index) => {
              const ref = scriptRefMap[txo.script];
              const atom = existingRefs[ref] || accepted[ref];
              if (atom) {
                atom.lastTxoId = ids[index];
                atom.spent = 0;
                await db.atom.put(atom);
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
      }) as ElectrumCallback,
      scriptHash
    );
  }
}
