import { ElectrumWS } from "ws-electrumx-client";

// ElectrumWS doesn't support changing endpoint so this class is used to reconnect and resubscribe
// TODO Refactor so ws-electrumx-client can be removed and not need the manager class
export default class ElectrumManager {
  public endpoint?: string;
  public client?: ElectrumWS;

  public connected(): boolean {
    return !!this.client && this.client.isConnected();
  }

  public events: [string, (...args: unknown[]) => void][] = [];

  public addEvent(eventName: string, callback: (...args: unknown[]) => void) {
    this.events.push([eventName, callback]);
  }

  public changeEndpoint(endpoint: string): boolean {
    if (this.connected() && this.client) {
      this.client.close("");
    }
    this.endpoint = endpoint;
    try {
      this.client = new ElectrumWS(endpoint);
    } catch (error) {
      return false;
    }

    this.events.forEach(([eventName, callback]) => {
      this.client?.on(eventName, callback);
    });

    return true;
  }

  public reconnect() {
    if (this.endpoint) {
      return this.changeEndpoint(this.endpoint);
    }
    return false;
  }

  public disconnect(reason = "") {
    if (this.client) {
      this.client.close(reason);
    }
  }
}
