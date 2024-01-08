import { p2pkhScriptHash } from "@lib/script";
import {
  Subscription,
  ContractType,
  ElectrumCallback,
  ElectrumStatusUpdate,
} from "@app/types";
import { buildUpdateTXOs } from "./buildUpdateTXOs";
import db from "@app/db";
import ElectrumManager from "@app/electrum/ElectrumManager";

export class RXDSubscription implements Subscription {
  protected updateTXOs: ElectrumStatusUpdate;
  private electrum: ElectrumManager;

  constructor(electrum: ElectrumManager) {
    this.electrum = electrum;
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.RXD);
  }

  async register(address: string) {
    const scriptHash = p2pkhScriptHash(address as string);

    // Create status record if it doesn't exist
    if (!(await db.subscriptionStatus.get(scriptHash))) {
      db.subscriptionStatus.put({ scriptHash, status: "" });
    }

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      (async (scriptHash: string, newStatus: string) => {
        await this.updateTXOs(scriptHash, newStatus);

        // FIXME toast received value

        const balance = await this.electrum.client?.request(
          "blockchain.scripthash.get_balance",
          scriptHash
        );
        db.subscriptionStatus.update(scriptHash, { balance });
      }) as ElectrumCallback,
      scriptHash
    );
  }
}
