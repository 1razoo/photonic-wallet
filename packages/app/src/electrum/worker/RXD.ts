import { p2pkhScriptHash } from "@lib/script";
import {
  Subscription,
  ContractType,
  ElectrumCallback,
  ElectrumStatusUpdate,
} from "@app/types";
import { buildUpdateTXOs } from "./updateTxos";
import db from "@app/db";
import ElectrumManager from "@app/electrum/ElectrumManager";
import setSubscriptionStatus from "./setSubscriptionStatus";

export class RXDWorker implements Subscription {
  protected updateTXOs: ElectrumStatusUpdate;
  private electrum: ElectrumManager;
  protected lastReceivedStatus: string;

  constructor(electrum: ElectrumManager) {
    this.electrum = electrum;
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.RXD);
    this.lastReceivedStatus = "";
  }

  async register(address: string) {
    const scriptHash = p2pkhScriptHash(address as string);

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      (async (scriptHash: string, status: string) => {
        // Same subscription can be returned twice
        if (status === this.lastReceivedStatus) {
          return;
        }
        this.lastReceivedStatus = status;

        const { added } = await this.updateTXOs(scriptHash, status);

        added.map((txo) => db.txo.put(txo).catch());

        // Update balances
        let confirmed = 0;
        let unconfirmed = 0;
        await db.txo
          .where({ contractType: ContractType.RXD, spent: 0 })
          .each(({ height, value }) => {
            if (height === Infinity) {
              unconfirmed += value;
            } else {
              confirmed += value;
            }
          });

        setSubscriptionStatus(scriptHash, status, ContractType.RXD);
        db.balance.put({ id: address, confirmed, unconfirmed });
      }) as ElectrumCallback,
      scriptHash
    );
  }
}
