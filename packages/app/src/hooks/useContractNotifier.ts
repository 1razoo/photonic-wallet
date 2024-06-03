import db from "@app/db";
import { network } from "@app/signals";
import { ContractType, TxO } from "@app/types";
import { useToast } from "@chakra-ui/react";
import { reverseRef } from "@lib/Outpoint";
import { photonsToRXD } from "@lib/format";
import { parseFtScript, parseNftScript } from "@lib/script";
import { t } from "@lingui/macro";

async function rxdNotification(utxo: TxO) {
  return t`${photonsToRXD(utxo.value)} ${network.value.ticker}  received`;
}

async function nftNotification(utxo: TxO) {
  const { ref: refLE } = parseNftScript(utxo.script);
  if (!refLE) return;
  const ref = reverseRef(refLE);
  const rst = await db.rst.get({ ref });
  if (!rst) return "";
  return t`Digital object ${rst?.name && `"${rst.name}"`} received`;
}

async function ftNotification(utxo: TxO) {
  const { ref: refLE } = parseFtScript(utxo.script);
  if (!refLE) return;
  const ref = reverseRef(refLE);
  const rst = await db.rst.get({ ref });
  if (!rst) return "";
  const { ticker } = rst?.args || {};
  return t`${utxo.value} ${ticker || rst?.name || "???"}  received`;
}

export default function useContractNotifier() {
  const toast = useToast();
  return async (utxo: TxO) => {
    let text;
    switch (utxo.contractType) {
      case ContractType.RXD:
        text = await rxdNotification(utxo);
        break;
      case ContractType.NFT:
        text = await nftNotification(utxo);
        break;
      case ContractType.FT:
        text = await ftNotification(utxo);
        break;
    }

    if (text) {
      toast({
        title: text,
      });
    }
  };
}
