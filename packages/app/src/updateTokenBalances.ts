import Outpoint from "@lib/Outpoint";
import db from "./db";
import { ContractType } from "./types";
import { ftBalance } from "./signals";
import { parseFtScript } from "@lib/script";

export async function updateTokenBalances() {
  // Calculate token balances
  const balances = new Map<
    string,
    { confirmed: number; unconfirmed: number }
  >();
  await db.txo
    .where({ contractType: ContractType.FT, spent: 0 })
    .each(({ script, value, height }) => {
      const ref = Outpoint.fromString(parseFtScript(script).ref as string)
        .reverse()
        .ref();
      const k = height === Infinity ? "unconfirmed" : "confirmed";
      const obj = balances.get(ref) || { confirmed: 0, unconfirmed: 0 };
      balances.set(ref, { ...obj, [k]: obj[k] + value });
    });
  ftBalance.value = Object.fromEntries(balances);
}
