/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Transaction,
  // @ts-ignore
} from "@radiantblockchain/radiantjs";
import db from "@app/db";
import { ContractType, ElectrumTxResponse, TxO, Utxo } from "@app/types";
import ElectrumManager from "@app/electrum/ElectrumManager";

export type ElectrumTxMap = {
  [key: string]: { raw: ElectrumTxResponse; tx: Transaction };
};

export const buildUpdateTXOs =
  (electrum: ElectrumManager, contractType: ContractType) =>
  async (
    scriptHash: string,
    newStatus: string
  ): Promise<{
    added: TxO[];
    confs: Map<number, Utxo>;
    newTxs?: ElectrumTxMap;
    spent: number[];
  }> => {
    // Check if status has changed
    const currentStatus = await db.subscriptionStatus
      .where({ scriptHash })
      .first();

    // TODO rebuild status from data instead of using stored value
    if (currentStatus?.status === newStatus) {
      console.debug("Status unchanged", newStatus, scriptHash, contractType);
      return { added: [], confs: new Map(), newTxs: undefined, spent: [] };
    }

    // Fetch unspent outputs
    const utxos = (await electrum.client?.request(
      "blockchain.scripthash.listunspent",
      scriptHash
    )) as Utxo[];
    console.debug("Unspent", contractType, utxos);

    // Check tx exists in database
    // Dedup any transactions that have multiple UTXOs for this wallet
    const txIds = new Set<string>();
    const newUtxos: Utxo[] = [];
    const outpoints: string[] = []; // All UTXO outpoints
    const confs: Map<number, Utxo> = new Map(); // Newly confirmed transactions mapped by txo id
    await Promise.all(
      utxos.map(async (utxo) => {
        outpoints.push(`${utxo.tx_hash}${utxo.tx_pos}`);
        const exist = await db.txo
          .where({ txid: utxo.tx_hash, vout: utxo.tx_pos })
          .first();
        if (!exist) {
          txIds.add(utxo.tx_hash);
          newUtxos.push(utxo);
        } else if (exist.id && exist.height != utxo.height) {
          // FIXME this will cause fetch on these utxos, is that necessary?
          txIds.add(utxo.tx_hash);
          confs.set(exist.id, utxo);
        }
      })
    );

    // Update spent UTXOs
    const spent = (await db.txo.where({ contractType, spent: 0 }).toArray())
      .map(({ id, txid, vout }) =>
        outpoints.includes(`${txid}${vout}`) ? undefined : id
      )
      .filter(Boolean) as number[];
    await db.transaction("rw", db.txo, async () => {
      for (const update of spent) {
        await db.txo.update(update, {
          spent: 1,
        });
      }
    });

    // Get transactions not in the database
    // Convert to an object indexed by txid
    const newTxs: {
      [key: string]: { tx: Transaction; raw: ElectrumTxResponse };
    } = Object.fromEntries(
      await Promise.all(
        [...txIds].map(async (txId) => {
          const raw = (await electrum.client?.request(
            "blockchain.transaction.get",
            txId,
            true
          )) as ElectrumTxResponse;

          if (raw) {
            const tx = new Transaction(raw.hex);
            return [raw.hash, { tx, raw }];
          }
          return [undefined, undefined];
        })
      )
    );

    const added = await Promise.all(
      newUtxos.map(async (utxo) => {
        const txo: TxO = {
          txid: utxo.tx_hash,
          vout: utxo.tx_pos,
          script: newTxs[utxo.tx_hash].tx.outputs[utxo.tx_pos].script.toHex(),
          value: utxo.value,
          date: newTxs[utxo.tx_hash].raw.time || undefined,
          height: utxo.height || Infinity,
          spent: 0,
          contractType,
        };
        // Awaiting ensures the id property will be set
        // Data for related tables will need this
        await db.txo.add(txo);
        return txo;
      })
    );

    // Update confirmations
    await db.transaction("rw", db.txo, async () => {
      for (const [id, utxo] of confs) {
        await db.txo.update(id, {
          height: utxo.height || Infinity,
          date: newTxs[utxo.tx_hash].raw.time || undefined,
        });
      }
    });

    db.subscriptionStatus.update(scriptHash, { status: newStatus });

    return { added, confs, newTxs, spent };
  };
