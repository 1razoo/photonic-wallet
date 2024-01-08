import { network } from "@app/signals";

export default function createExplorerUrl(txid: string) {
  return network.value.explorer.tx.replace("{txid}", txid);
}
