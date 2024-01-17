/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import bsvCoinSelect from "bsv-coinselect";
import type { TxO } from "@app/types";

export default function coinSelect(
  address: string,
  utxos: (TxO & { required?: boolean })[],
  target: {
    script: string;
    value: number;
  }[],
  changeScript: string,
  feeRate: number
) {
  const inputs = utxos
    .map((u) => ({
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
