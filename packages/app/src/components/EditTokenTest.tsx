import db from "@app/db";
import useElectrum from "@app/electrum/useElectrum";
import { feeRate, wallet } from "@app/signals";
import { AtomNft, ContractType, TxO } from "@app/types";
import { EditIcon } from "@chakra-ui/icons";
import { GridItem, Button } from "@chakra-ui/react";
import Outpoint from "@lib/Outpoint";
import { encodeAtomMutable } from "@lib/atom";
import { fundTx, targetToUtxo } from "@lib/coinSelect";
import {
  mutableNftScript,
  nftAuthScript,
  p2pkhScript,
  parseMutableScript,
} from "@lib/script";
import { buildTx, findTokenOutput } from "@lib/tx";
import {
  AtomPayload,
  ElectrumRefResponse,
  UnfinalizedInput,
  Utxo,
} from "@lib/types";
import { t } from "@lingui/macro";
import { Transaction } from "@radiantblockchain/radiantjs";

// Testing mutable tokens
// Not used yet
export default function EditTokenTest({
  token,
  txo,
}: {
  token: AtomNft;
  txo: TxO;
}) {
  const client = useElectrum();
  const editToken = async () => {
    if (!wallet.value.wif) {
      return;
    }

    const nftRefBE = Outpoint.fromString(token.ref);
    const nftRefLE = nftRefBE.reverse().toString();
    const { txid, vout: refVout } = nftRefBE.toObject();
    const mutRefBE = Outpoint.fromUTXO(txid, refVout + 1);
    const mutRefLE = mutRefBE.reverse().toString();

    const refResponse = (await client.request(
      "blockchain.ref.get",
      mutRefBE.toString()
    )) as ElectrumRefResponse;
    if (!refResponse.length) {
      return;
    }
    const location = refResponse[refResponse.length - 1].tx_hash;

    const hex = await client.request("blockchain.transaction.get", location);
    const refTx = new Transaction(hex);
    const { vout, output } = findTokenOutput(
      refTx,
      mutRefLE,
      parseMutableScript
    );

    if (!vout) {
      return;
    }

    const payload: Partial<AtomPayload> = {
      "main.txt": new TextEncoder().encode("mutable token is working"),
    };
    const atom = encodeAtomMutable("mod", payload, 1, 1, 0, 0);
    const mutOutputScript = mutableNftScript(mutRefLE, atom.payloadHash);
    const nftOutputScript = nftAuthScript(wallet.value.address, nftRefLE, [
      { ref: mutRefLE, scriptSigHash: atom.scriptSigHash },
    ]);

    const nftInput: UnfinalizedInput = { ...txo };
    const mutInput: UnfinalizedInput = {
      txid: refTx.id,
      vout,
      script: output.script.toHex(),
      value: output.satoshis,
      scriptSigSize: mutOutputScript.length / 2,
    };
    const nftOutput = {
      script: nftOutputScript,
      value: txo.value,
    };
    const mutOutput = {
      script: mutOutputScript,
      value: mutInput.value,
    };

    const inputs = [nftInput, mutInput];
    const outputs = [nftOutput, mutOutput];
    let rxd: Utxo[] = await db.txo
      .where({ contractType: ContractType.RXD, spent: 0 })
      .toArray();

    const p2pkh = p2pkhScript(wallet.value.address);
    const fund = fundTx(
      wallet.value.address,
      rxd,
      inputs,
      outputs,
      p2pkh,
      feeRate.value
    );

    inputs.push(...fund.funding);
    outputs.push(...fund.change);

    const tx = buildTx(
      wallet.value.address,
      wallet.value.wif,
      inputs,
      outputs,
      false,
      (index, script) => {
        if (index === 1) {
          // Clear p2pkh script sig
          script.set({ chunks: [] });
          // Add mutable script sig
          script.add(atom.script);
        }
      }
    );

    // Revert token back to a standard script so the wallet can use it again
    // Maybe ElectrumX can be modified to ignore PUSH + DROP opcodes?
    const [newNftInput, , ...changeInputs] = targetToUtxo(outputs, tx.id);
    rxd = [...fund.remaining, ...changeInputs];
    const newNftOutput = { script: nftInput.script, value: nftInput.value };

    const revertFund = fundTx(
      wallet.value.address,
      rxd,
      [newNftInput],
      [newNftOutput],
      p2pkh,
      feeRate.value
    );

    const revertTx = buildTx(
      wallet.value.address,
      wallet.value.wif,
      [newNftInput, ...revertFund.funding],
      [newNftOutput, ...revertFund.change],
      false
    );

    console.log(
      await client.request("blockchain.transaction.broadcast", tx.toString())
    );
    console.log(
      await client.request(
        "blockchain.transaction.broadcast",
        revertTx.toString()
      )
    );
  };
  return (
    <GridItem
      as={Button}
      onClick={editToken}
      leftIcon={<EditIcon />}
      colSpan={2}
    >
      {t`Edit`}
    </GridItem>
  );
}
