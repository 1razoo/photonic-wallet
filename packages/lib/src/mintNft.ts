import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { TxO } from "@app/types";
import Outpoint from "./Outpoint";
import { encodeAtom } from "./atom";
import coinSelect from "./coinSelect";
import {
  p2pkhScript,
  nftCommitScript,
  nftScript,
  mutableNftScript,
} from "./script";
import { buildTx } from "./tx";

// Used for fee calculation before tx is signed
const dummyPKHScriptSig = "0".repeat(214);

function txId(tx: string) {
  return bytesToHex(sha256(sha256(tx)));
}

// TODO split into multiple functions so if reveal fails it can be resent
export default async function mintNft(
  broadcast: (txHex: string) => Promise<string>,
  address: string,
  utxos: TxO[],
  payload: object,
  wif: string,
  immutable: boolean,
  authorUTXO?: TxO,
  containerUTXO?: TxO,
  dryRun?: boolean
) {
  let fee = 0;
  const { atomScript, atomPayloadHash } = encodeAtom("nft", payload);
  const changeScript = p2pkhScript(address);
  const authorRef = authorUTXO?.script.substring(2, 74);
  const containerRef = containerUTXO?.script.substring(2, 74);
  const commitScript = nftCommitScript(
    address,
    atomPayloadHash,
    authorRef,
    containerRef
  );
  const authorInput = authorUTXO && {
    ...authorUTXO,
    required: true,
    script: "",
  };
  const containerInput = containerUTXO && {
    ...containerUTXO,
    required: true,
    script: "",
  };

  // Remove the script because coinselect will expect it to be a script sig for inputs, resulting in incorrect fee calculation
  const coins = utxos.map((c) => ({ ...c, script: "" }));

  const required = [authorInput, containerInput].filter(Boolean) as (TxO & {
    required: boolean;
  })[];
  const target = [];
  // Author and container outputs are first
  if (authorUTXO) {
    target.push({ script: authorUTXO.script, value: 1 });
  }
  if (containerUTXO) {
    target.push({ script: containerUTXO.script, value: 1 });
  }
  // Commit output
  target.push({ script: commitScript, value: 1 });
  if (!immutable) {
    // Prepare a ref for the mutable contract. This will be token ref + 1.
    target.push({ script: changeScript, value: 1 });
  }

  const selected = coinSelect(
    address,
    [...required, ...coins],
    target,
    changeScript,
    2000
  );

  if (!selected.inputs) {
    console.debug("No coins selected", {
      address,
      required,
      target,
      changeScript,
    });
    throw new Error("Insufficient balance");
  }

  // coinselect removes the input scripts so put the author script back
  // These are needed so buildTx knows it has a non-standard script
  selected.inputs.forEach((input: TxO) => {
    if (
      authorUTXO &&
      input.txid === authorUTXO.txid &&
      input.vout === authorUTXO.vout
    )
      input.script = authorUTXO.script;
    if (
      containerInput &&
      input.txid === containerUTXO.txid &&
      input.vout === containerUTXO.vout
    )
      input.script = containerUTXO.script;
  });

  fee += selected.fee;

  // Remove selected from coins
  const newCoins: (TxO & { required?: boolean })[] = coins.filter(
    (coin) =>
      !selected.inputs.some(
        (utxo: TxO) => coin.txid === utxo.txid && coin.vout === utxo.vout
      )
  );

  const rawTx = buildTx(
    address,
    wif as string,
    selected.inputs,
    selected.outputs,
    false
  ).toString();

  const txid = dryRun ? txId(rawTx) : await broadcast(rawTx);
  console.debug("Commit", txid);

  // Slice to remove author and container outputs
  const commitScriptSig = `${dummyPKHScriptSig}${atomScript.toHex()}`;
  const tokenIndex = (authorUTXO ? 1 : 0) + (containerUTXO ? 1 : 0);
  (selected.outputs.slice(tokenIndex) as TxO[]).forEach((utxo, vout) => {
    const isCommitOutput = vout === 0;
    const isMutableOutput = vout === 1 && !immutable;
    // Add new UTXOs
    newCoins.push({
      ...utxo,
      txid,
      vout: vout + tokenIndex, // + 1 or 2 to account for removed author/container outputs
      required: isCommitOutput || isMutableOutput, // Must include the commit input and mutable ref UTXO if needed
      script: isCommitOutput ? commitScriptSig : "", // Script sig for reveal
    });
  });

  const nftRef = Outpoint.fromUTXO(txid, tokenIndex).reverse().ref();
  const script = nftScript(address, nftRef);
  const outputs = [{ script, value: 1 }];
  console.debug("Added token output", {
    address,
    nftRef,
    script,
  });
  if (!immutable) {
    const mutableRef = Outpoint.fromUTXO(txid, tokenIndex + 1)
      .reverse()
      .ref();
    outputs.push({
      script: mutableNftScript(mutableRef, nftRef, atomPayloadHash),
      value: 1,
    });
    console.debug("Added mutable contract output", {
      mutableRef,
      nftRef,
      atomPayloadHash,
    });
  }
  const newSelected = coinSelect(
    address,
    newCoins,
    outputs,
    changeScript,
    2000
  );

  // Order of inputs returned from coinselect might not be correct! This will cause setInputScript index to be incorrect
  // Token input must be first, the rest can be in any order
  newSelected.inputs.sort((i: { script: string }) =>
    i.script === "" ? 1 : -1
  );

  newSelected.inputs[0].script = commitScript;
  fee += newSelected.fee;

  const newRawTx = buildTx(
    address,
    wif as string,
    newSelected.inputs,
    newSelected.outputs,
    false,
    (index, script) => {
      if (index === 0) {
        script.add(atomScript);
      }
    }
  ).toString();
  const result = dryRun ? txId(newRawTx) : await broadcast(newRawTx);
  console.debug("Mint complete", rawTx, newRawTx);

  return {
    ref: txid,
    reveal: result,
    fee,
    size: (rawTx.length + newRawTx.length) / 2,
  };
}
