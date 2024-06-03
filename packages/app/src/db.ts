import Dexie, { Table } from "dexie";
import {
  SmartToken,
  TxO,
  BlockHeader,
  SubscriptionStatus,
  ContractBalance,
} from "./types";
import config from "@app/config.json";

export type KeyValuePairs = unknown;

export class Database extends Dexie {
  txo!: Table<TxO>;
  rst!: Table<SmartToken>;
  subscriptionStatus!: Table<SubscriptionStatus>;
  kvp!: Table<KeyValuePairs>;
  header!: Table<BlockHeader>;
  balance!: Table<ContractBalance>;

  constructor() {
    super("photonic");
    this.version(1).stores({
      txo: "++id, &[txid+vout], contractType, [contractType+spent], [script+spent], [change+spent]",
      subscriptionStatus: "scriptHash",
      balance: "id",
      rst: "++id, &ref, [type+spent], [type+spent+fresh], lastTxoId, height, rstType",
      kvp: "",
      header: "hash, height",
      txq: "txid",
    });
  }
}

const db = new Database();

// Populate the database
db.on("ready", async () => {
  const defaults = config.defaultConfig;
  const configKeys = Object.keys(defaults);
  const missing = (await db.kvp.bulkGet(configKeys))
    .map((v, i) =>
      v
        ? false
        : [
            configKeys[i],
            (defaults as { [key: string]: unknown })[configKeys[i]],
          ]
    )
    .filter(Boolean);

  if (missing.length) {
    const obj = Object.fromEntries(missing as []);
    return db.kvp.bulkPut(Object.values(obj), Object.keys(obj));
  }
});

export default db;
