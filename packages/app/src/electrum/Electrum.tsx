import { useLiveQuery } from "dexie-react-hooks";
import { t } from "@lingui/macro";
import db from "@app/db";
import { useEffect } from "react";
import { electrumStatus, wallet } from "@app/signals";
import { useToast } from "@chakra-ui/react";
import { ElectrumStatus } from "@app/types";
import { wrap } from "comlink";
import { signal } from "@preact/signals-react";
import { ElectrumRefResponse } from "@lib/types";

// Android Chrome doesn't support shared workers, fall back to dedicated worker
const sharedSupported = "SharedWorker" in globalThis;

// SharedWorker and Worker must be used directly so Vite can compile the worker
const worker = sharedSupported
  ? new SharedWorker(new URL("./worker/electrumWorker.ts", import.meta.url), {
      type: "module",
    }).port
  : new Worker(new URL("./worker/electrumWorker.ts", import.meta.url), {
      type: "module",
    });

const wrapped = wrap<{
  connect: (endpoint: string, address: string) => void;
  isReady: () => boolean;
  reconnect: () => boolean;
  disconnect: (reason: string) => void;
  broadcast: (hex: string) => string;
  getRef: (ref: string) => ElectrumRefResponse;
  getTransaction: (txid: string) => string;
}>(worker);
export const electrumWorker = signal<typeof wrapped>(wrapped);

export default function Electrum() {
  const toast = useToast();

  // Electrum connection is handled by a worker. It will set connection status in the database using Dexie.
  useLiveQuery(async () => {
    const result = (await db.kvp.get("electrumStatus")) as { status: number };
    if (
      (await electrumWorker.value.isReady()) &&
      result &&
      result.status !== electrumStatus.value
    ) {
      electrumStatus.value = result.status;

      if (result.status === ElectrumStatus.CONNECTED) {
        toast({
          title: t`Connected`,
          status: "success",
        });
      } else if (result.status === ElectrumStatus.DISCONNECTED) {
        toast({
          title: t`Disconnected`,
          // FIXME
          status: "error", //reason === "user" ? "success" : "error",
        });
      }
    }
  });

  const server = useLiveQuery(async () => {
    const servers = (await db.kvp.get("servers")) as {
      mainnet: string[];
      testnet: string[];
    };
    return servers[wallet.value.net][0];
  }, [wallet.value.net]);

  // Reconnect when server config changes or when wallet is ready
  useEffect(() => {
    if (server && wallet.value.address) {
      electrumWorker.value.connect(server, wallet.value.address);
    }
  }, [server, wallet.value.address]);

  return null;
}
