import { electrumWorker } from "@app/electrum/Electrum";
import { Atom } from "@app/types";
import { DownloadIcon } from "@chakra-ui/icons";
import { GridItem, Button } from "@chakra-ui/react";
import Outpoint from "@lib/Outpoint";
import { decodeAtom } from "@lib/atom";
import { parseMutableScript } from "@lib/script";
import { findTokenOutput } from "@lib/tx";
import { t } from "@lingui/macro";
import { Transaction } from "@radiantblockchain/radiantjs";

// Testing mutable tokens
// Not used yet

async function fetchAtomData(ref: Outpoint, immutable: boolean) {
  const refResponse = await electrumWorker.value.getRef(ref.toString());

  if (!refResponse.length) {
    return;
  }
  const location = refResponse[immutable ? 0 : refResponse.length - 1].tx_hash;

  const hex = await electrumWorker.value.getTransaction(location);
  const refTx = new Transaction(hex);
  const { vout } = findTokenOutput(
    refTx,
    ref.reverse().toString(),
    immutable ? undefined : parseMutableScript
  );

  if (vout === undefined) {
    return;
  }

  const input = refTx.inputs[vout];

  const decoded = decodeAtom(input.script);
  const text = decoded?.files["main.txt"];
  if (text instanceof Uint8Array) {
    console.log(new TextDecoder("utf-8").decode(text));
  } else {
    console.log(decoded?.files);
  }
}

export default function FetchTokenTest({ token }: { token: Atom }) {
  const fetchToken = async () => {
    const nftRef = Outpoint.fromString(token.ref);
    const { txid, vout: refVout } = nftRef.toObject();
    const mutRef = Outpoint.fromUTXO(txid, refVout + 1);

    fetchAtomData(nftRef, true);
    fetchAtomData(mutRef, false);
  };
  return (
    <GridItem
      as={Button}
      onClick={fetchToken}
      leftIcon={<DownloadIcon />}
      colSpan={2}
    >
      {t`Fetch`}
    </GridItem>
  );
}
