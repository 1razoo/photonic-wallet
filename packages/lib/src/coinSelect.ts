/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import bsvCoinSelect from "bsv-coinselect";
import { UnfinalizedInput, UnfinalizedOutput, Utxo } from "./types";

export type SelectableInput = UnfinalizedInput & { required?: boolean };

// Convert a target object to a UTXO with txid and vout properties
export const targetToUtxo = (
  target: UnfinalizedOutput[],
  txid: string,
  voutStart = 0
): Utxo[] =>
  target.map((t, i) => ({
    txid: txid,
    vout: voutStart + i,
    ...t,
  }));

export function coinSelect(
  address: string,
  utxos: SelectableInput[],
  target: {
    script: string;
    value: number;
  }[],
  changeScript: string,
  feeRate: number
) {
  const inputs = utxos.map((u) => ({
    address,
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    // height:  // FIXME
    required: u.required || false,
    script: u.script,
  }));

  return bsvCoinSelect(inputs, target, feeRate, changeScript);
}

/**
 * Select coins to fund a transaction
 * Returns:
 * - Funding UTXOs
 * - Unspent outputs with funding UTXOs removed
 * - Change UTXO
 * - Fee
 */
export function fundTx(
  address: string,
  utxos: UnfinalizedInput[],
  requiredInputs: UnfinalizedInput[],
  target: UnfinalizedOutput[],
  changeScript: string,
  feeRate: number
) {
  const required = requiredInputs.map((i) => ({ ...i, required: true }));
  const inputs = ([...required, ...utxos] as SelectableInput[]).map((u) => ({
    address,
    txid: u.txid,
    vout: u.vout,
    value: u.value,
    // height:  // FIXME
    required: u.required || false,
    script: u.scriptSigSize ? "00".repeat(u.scriptSigSize) : "", // Create dummy script sig. If empty, coinselect will default to p2pkh
  }));

  const selected: {
    inputs: SelectableInput[];
    outputs: { script: string; value: number }[];
    fee: number;
  } = bsvCoinSelect(inputs, target, feeRate, changeScript);

  // Find funding inputs
  const remaining = [...utxos];
  const funding = selected.inputs
    .filter((input) => !input.required)
    .map((input) => {
      const found = utxos.find(
        (u) => u.txid === input.txid && u.vout === input.vout
      );

      if (!found) {
        throw Error("Coin selection failed");
      }

      // Remove from remaining UTXOs
      remaining.splice(remaining.indexOf(found), 1);

      return found;
    });

  // Find change outputs
  const change = selected.outputs.slice(target.length);

  return { funding, remaining, change, fee: selected.fee };
}

export function updateUnspent(
  { remaining, change }: { remaining: Utxo[]; change: UnfinalizedOutput[] },
  changeTxid: string,
  changeVoutStart: number
) {
  return [...remaining, ...targetToUtxo(change, changeTxid, changeVoutStart)];
}

export default coinSelect;
