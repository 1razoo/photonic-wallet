/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  Transaction,
  Script,
  PrivateKey,
  crypto,
} from "@radiantblockchain/radiantjs";
import { Buffer } from "buffer";

type Input = {
  txid: string;
  value: number;
  vout: number;
  nonStandard: boolean;
  script?: string;
};

export const buildTx = (
  address: string,
  wif: string,
  inputs: Input[],
  outputs: { script: string; value: number }[],
  addChangeOutput = true,
  setInputScriptCallback?: (index: number, script: Script) => void
) => {
  const tx = new Transaction();
  const p2pkh = Script.fromAddress(address).toHex();
  const privKey = PrivateKey.fromWIF(wif);

  inputs.forEach((input, index) => {
    if (input.script) {
      tx.addInput(
        new Transaction.Input({
          prevTxId: input.txid,
          outputIndex: input.vout,
          script: new Script(),
          output: new Transaction.Output({
            script: input.script,
            satoshis: input.value,
          }),
        })
      );
      // @ts-ignore
      tx.setInputScript(index, (tx, output) => {
        const sigType =
          crypto.Signature.SIGHASH_ALL | crypto.Signature.SIGHASH_FORKID;
        const sig = Transaction.Sighash.sign(
          tx,
          privKey,
          sigType,
          index,
          output.script,
          // @ts-ignore
          new crypto.BN(output.satoshis)
        );
        const spendScript = Script.empty()
          .add(Buffer.concat([sig.toBuffer(), Buffer.from([sigType])]))
          .add(privKey.toPublicKey().toBuffer());
        if (setInputScriptCallback) {
          setInputScriptCallback(index, spendScript);
        }
        return spendScript.toString();
      });
    } else {
      tx.from({
        // privKey,
        address,
        txId: input.txid,
        outputIndex: input.vout,
        script: p2pkh,
        satoshis: input.value,
      });
    }
  });

  outputs.forEach(({ script, value }) => {
    tx.addOutput(
      new Transaction.Output({
        script,
        satoshis: value,
      })
    );
  });
  if (addChangeOutput) {
    tx.change(address);
  }
  tx.sign(privKey);
  tx.seal();

  return tx;
};
