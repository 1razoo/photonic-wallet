import { Outlet /*, ScrollRestoration*/ } from "react-router-dom";
import Unlock from "./components/Unlock";
import ElectrumProvider from "./electrum/ElectrumProvider";
import SendReceive from "./components/SendReceive";
import db from "./db";
import { NetworkKey, SavedWallet } from "./types";
import { useLiveQuery } from "dexie-react-hooks";
import { balance, network, wallet } from "./signals";
import { nftScriptHash, p2pkhScriptHash } from "@lib/script";
import { useEffect } from "react";
import config from "./config.json";
import { batch } from "@preact/signals-react";

// Sync wallet balance signals with database
// TODO move this somewhere else
function WalletSync() {
  const { address } = wallet.value;

  const p2pkhSH = address && p2pkhScriptHash(address as string);
  const rxd = useLiveQuery(
    () => db.subscriptionStatus.where({ scriptHash: p2pkhSH }).first(),
    [p2pkhSH]
  );
  const nftSH = address && nftScriptHash(address as string);
  const nft = useLiveQuery(
    () => db.subscriptionStatus.where({ scriptHash: nftSH }).first(),
    [nftSH]
  );

  useEffect(() => {
    if (!rxd || !nft) return;
    balance.value = {
      ready: true,
      coins: {
        confirmed: rxd.balance?.confirmed || 0,
        unconfirmed: rxd.balance?.unconfirmed || 0,
      },
      assets: {
        confirmed: nft.balance?.confirmed || 0,
        unconfirmed: nft.balance?.unconfirmed || 0,
      },
    };
  }, [rxd, nft]);

  return null;
}

function Main() {
  const { exists } = wallet.value;

  return (
    <>
      <WalletSync />
      {/* <ScrollRestoration /> Disabled for now, causing issues with some buttons  */}
      <ElectrumProvider>
        <Outlet />
        {exists && (
          <>
            <Unlock />
            <SendReceive />
          </>
        )}
      </ElectrumProvider>
    </>
  );
}

export default function App() {
  const saved = useLiveQuery(
    async () => (await db.kvp.get("wallet")) as SavedWallet,
    [],
    null
  );

  useEffect(() => {
    if (saved !== null) {
      const net = saved?.net || "testnet";
      batch(() => {
        wallet.value = {
          ready: true,
          address: saved?.address || "",
          exists: !!saved,
          net,
          locked: true,
        };
        network.value = config.networks[net as NetworkKey];
      });
    }
  }, [saved]);

  if (saved === null) {
    return <></>;
  }

  return <Main />;
}
