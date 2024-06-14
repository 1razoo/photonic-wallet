import db from "@app/db";
import { network } from "@app/signals";
import { ContractType, TxO } from "@app/types";
import { useToast } from "@chakra-ui/react";
import { reverseRef } from "@lib/Outpoint";
import { photonsToRXD } from "@lib/format";
import { parseFtScript, parseNftScript } from "@lib/script";
import { t } from "@lingui/macro";

async function rxdNotification(utxo: TxO) {
  return t`${photonsToRXD(utxo.value)} ${network.value.ticker} received`;
}

async function nftNotification(utxo: TxO) {
  const { ref: refLE } = parseNftScript(utxo.script);
  if (!refLE) return;
  const ref = reverseRef(refLE);
  const glyph = await db.glyph.get({ ref });
  if (!glyph) return "";
  return t`NFT ${glyph?.name && `"${glyph.name}"`} received`;
}

async function ftNotification(utxo: TxO) {
  const { ref: refLE } = parseFtScript(utxo.script);
  if (!refLE) return;
  const ref = reverseRef(refLE);
  const glyph = await db.glyph.get({ ref });
  if (!glyph) return "";
  const { ticker } = glyph || {};
  return t`${utxo.value} ${ticker || glyph?.name || "???"} received`;
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
