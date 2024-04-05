import Dexie, { Table } from "dexie";
import { Atom, TxO, BlockHeader } from "./types";
import config from "@app/config.json";

export type KeyValuePairs = unknown;

export interface SubscriptionStatus {
  scriptHash: string;
  status: string;
  balance?: { confirmed: number; unconfirmed: number };
}

export class Database extends Dexie {
  txo!: Table<TxO>;
  atom!: Table<Atom>;
  subscriptionStatus!: Table<SubscriptionStatus>;
  kvp!: Table<KeyValuePairs>;
  header!: Table<BlockHeader>;

  constructor() {
    super("photonic");
    this.version(1).stores({
      txo: "++id, &[txid+vout], contractType, [contractType+spent], [script+spent], height",
      subscriptionStatus: "scriptHash",
      atom: "++id, &ref, [type+spent], [type+spent+fresh], lastTxoId, height",
      kvp: "",
      header: "hash, height",
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
