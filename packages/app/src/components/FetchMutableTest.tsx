import useElectrum from "@app/electrum/useElectrum";
import { wallet } from "@app/signals";
import { AtomNft, TxO } from "@app/types";
import { DownloadIcon } from "@chakra-ui/icons";
import { GridItem, Button } from "@chakra-ui/react";
import Outpoint from "@lib/Outpoint";
import { decodeAtom } from "@lib/atom";
import { parseMutableScript } from "@lib/script";
import { findTokenOutput } from "@lib/tx";
import { ElectrumRefResponse } from "@lib/types";
import { t } from "@lingui/macro";
import { Transaction } from "@radiantblockchain/radiantjs";
import { ElectrumWS } from "ws-electrumx-client";

// Testing mutable tokens
// Not used yet

async function fetchAtomData(
  client: ElectrumWS,
  ref: Outpoint,
  immutable: boolean
) {
  const refResponse = (await client.request(
    "blockchain.ref.get",
    ref.toString()
  )) as ElectrumRefResponse;

  if (!refResponse.length) {
    return;
  }
  const location = refResponse[immutable ? 0 : refResponse.length - 1].tx_hash;

  const hex = await client.request("blockchain.transaction.get", location);
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

export default function FetchTokenTest({ token }: { token: AtomNft }) {
  const client = useElectrum();
  const fetchToken = async () => {
    const nftRef = Outpoint.fromString(token.ref);
    const { txid, vout: refVout } = nftRef.toObject();
    const mutRef = Outpoint.fromUTXO(txid, refVout + 1);

    fetchAtomData(client, nftRef, true);
    fetchAtomData(client, mutRef, false);
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
