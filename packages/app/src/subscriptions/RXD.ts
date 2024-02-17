import { t } from "@lingui/macro";
import { p2pkhScriptHash } from "@lib/script";
import {
  Subscription,
  ContractType,
  ElectrumCallback,
  ElectrumStatusUpdate,
} from "@app/types";
import { network } from "@app/signals";
import { buildUpdateTXOs } from "./buildUpdateTXOs";
import db from "@app/db";
import ElectrumManager from "@app/electrum/ElectrumManager";
import { CreateToastFnReturn } from "@chakra-ui/react";
import { photonsToRXD } from "@lib/format";
import { ElectrumBalanceResponse } from "@lib/types";

export class RXDSubscription implements Subscription {
  protected updateTXOs: ElectrumStatusUpdate;
  private electrum: ElectrumManager;

  constructor(electrum: ElectrumManager) {
    this.electrum = electrum;
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.RXD);
  }

  async register(address: string, toast: CreateToastFnReturn) {
    const scriptHash = p2pkhScriptHash(address as string);

    // Create status record if it doesn't exist
    if (!(await db.subscriptionStatus.get(scriptHash))) {
      db.subscriptionStatus.put({ scriptHash, status: "" });
    }

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      (async (scriptHash: string, newStatus: string) => {
        const { added, spent } = await this.updateTXOs(scriptHash, newStatus);

        const receivedTotal = added.reduce(
          (a, txo) => (txo.spent ? 0 : a + txo.value),
          0
        );
        const spentTotal = spent.reduce((a, { value }) => a + value, 0);
        const diff = receivedTotal - spentTotal;
        if (diff > 0) {
          toast({
            title: t`${photonsToRXD(diff)} ${network.value.ticker}  received`,
          });
        }

        // TODO need a better way to do this
        const balance = (await this.electrum.client?.request(
          "blockchain.scripthash.get_balance",
          scriptHash
        )) as ElectrumBalanceResponse;
        db.subscriptionStatus.update(scriptHash, { balance });
      }) as ElectrumCallback,
      scriptHash
    );
  }
}
