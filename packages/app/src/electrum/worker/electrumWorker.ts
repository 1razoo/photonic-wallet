import "./polyfill";
import { expose } from "comlink";
import ElectrumManager from "../ElectrumManager";
import { FTWorker, NFTWorker, RXDWorker } from "./index";
import db from "@app/db";
import { ElectrumStatus } from "@app/types";
import { ElectrumRefResponse } from "@lib/types";

declare const self: SharedWorkerGlobalScope;

const electrum = new ElectrumManager();
const rxd = new RXDWorker(electrum);
const nft = new NFTWorker(electrum);
const ft = new FTWorker(electrum);
// Disable until SPV is implemented
//const headers = new HeadersWorker(electrum);
let address = "";

const worker = {
  ready: false,
  connect(endpoint: string, _address: string) {
    if (electrum.endpoint !== endpoint || address !== _address) {
      this.ready = true;
      address = _address;
      console.debug(`Connecting: ${endpoint} ${address}`);
      db.kvp.put({ status: ElectrumStatus.CONNECTING }, "electrumStatus");
      electrum.changeEndpoint(endpoint);
    }
  },
  reconnect() {
    return electrum.reconnect();
  },
  disconnect(reason: string) {
    electrum.disconnect(reason);
  },
  async broadcast(hex: string) {
    return await electrum.client?.request(
      "blockchain.transaction.broadcast",
      hex
    );
  },
  async getRef(ref: string) {
    return (await electrum.client?.request(
      "blockchain.ref.get",
      ref
    )) as ElectrumRefResponse;
  },
  async getTransaction(txid: string) {
    return (await electrum.client?.request(
      "blockchain.transaction.get",
      txid
    )) as string;
  },
  isReady() {
    return this.ready;
  },
};

electrum.addEvent("connected", () => {
  db.kvp.put({ status: ElectrumStatus.CONNECTED }, "electrumStatus");
  if (address) {
    console.debug("Connected");
    rxd.register(address);
    nft.register(address);
    ft.register(address);
  }
});

electrum.addEvent("close", (event: unknown) => {
  const { reason } = event as { reason: string };
  db.kvp.put({ status: ElectrumStatus.DISCONNECTED, reason }, "electrumStatus");
});

// Android Chrome doesn't support shared workers, fall back to dedicated worker
if (globalThis instanceof SharedWorkerGlobalScope) {
  self.addEventListener("connect", (e) => expose(worker, e.ports[0]));
} else {
  expose(worker);
}
