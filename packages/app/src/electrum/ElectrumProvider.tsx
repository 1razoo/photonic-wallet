import { useLiveQuery } from "dexie-react-hooks";
import { t } from "@lingui/macro";
import db from "@app/db";
import ElectrumContext from "./ElectrumContext";
import ElectrumManager from "./ElectrumManager";
import { PropsWithChildren, useEffect } from "react";
import {
  RXDSubscription,
  NFTSubscription,
  //HeadersSubscription,
} from "@app/subscriptions";
import { electrumStatus, wallet } from "@app/signals";
import { useToast } from "@chakra-ui/react";
import { ElectrumStatus } from "@app/types";
import { FTSubscription } from "@app/subscriptions/FT";

const electrum = new ElectrumManager();
const rxd = new RXDSubscription(electrum);
const nft = new NFTSubscription(electrum);
const ft = new FTSubscription(electrum);
// Disable until SPV is implemented
//const headers = new HeadersSubscription(electrum);

export default function ElectrumProvider({ children }: PropsWithChildren) {
  const toast = useToast();
  const server = useLiveQuery(async () => {
    const servers = (await db.kvp.get("servers")) as {
      mainnet: string[];
      testnet: string[];
    };
    return servers[wallet.value.net][0];
  }, [wallet.value.net]);
  //headers.setNetwork(network);

  // Reconnect when server config changes or when wallet is ready
  useEffect(() => {
    if (server && wallet.value.address) {
      electrumStatus.value = ElectrumStatus.CONNECTING;
      electrum.changeEndpoint(server);
    }
  }, [server, wallet.value.address]);

  const onConnected = async () => {
    if (!wallet.value.address) return;
    rxd.register(wallet.value.address, toast);
    nft.register(wallet.value.address, toast);
    ft.register(wallet.value.address, toast);
    //headers.register();
  };

  useEffect(() => {
    electrum.addEvent("connected", () => {
      onConnected();
      electrumStatus.value = ElectrumStatus.CONNECTED;
      toast({
        title: t`Connected`,
        status: "success",
      });
    });
    electrum.addEvent("close", (event: unknown) => {
      const { reason } = event as { reason: string };
      electrumStatus.value = ElectrumStatus.DISCONNECTED;
      toast({
        title: t`Disconnected`,
        status: reason === "user" ? "success" : "error",
      });
    });
  }, []);

  return (
    <ElectrumContext.Provider value={electrum}>
      {children}
    </ElectrumContext.Provider>
  );
}
