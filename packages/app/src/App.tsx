import { useEffect } from "react";
import { Outlet /*, ScrollRestoration*/ } from "react-router-dom";
import { batch } from "@preact/signals-react";
import { useLiveQuery } from "dexie-react-hooks";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import Unlock from "./components/Unlock";
import ElectrumProvider from "./electrum/ElectrumProvider";
import SendReceive from "./components/SendReceive";
import db from "./db";
import { SavedWallet } from "./types";
import { balance, feeRate, network, wallet } from "./signals";
import { nftScriptHash, p2pkhScriptHash } from "@lib/script";
import config from "./config.json";
import useLanguageDetect from "./hooks/useLanguageDetect";
import ReloadPrompt from "./components/ReloadPrompt";
import { NetworkKey } from "@lib/types";
import { updateTokenBalances } from "./updateTokenBalances";
import { ViewPanelProvider } from "./layouts/ViewPanelLayout";

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

  useEffect(() => {
    updateTokenBalances();
  }, []);

  return null;
}

function Main() {
  const { exists } = wallet.value;

  return (
    <I18nProvider i18n={i18n}>
      <WalletSync />
      {/* <ScrollRestoration /> Disabled for now, causing issues with some buttons  */}
      <ElectrumProvider>
        <ViewPanelProvider>
          <Outlet />
        </ViewPanelProvider>
        {exists && (
          <>
            <Unlock />
            <SendReceive />
          </>
        )}
      </ElectrumProvider>
      <ReloadPrompt />
    </I18nProvider>
  );
}

export default function App() {
  const saved = useLiveQuery(
    async () =>
      (await db.kvp.bulkGet(["wallet", "feeRate"])) as [SavedWallet, number],
    [],
    null
  );

  useLanguageDetect();

  useEffect(() => {
    if (saved !== null) {
      const [savedWallet, savedFeeRate] = saved;
      const net = savedWallet?.net || "testnet";
      batch(() => {
        wallet.value = {
          ready: true,
          address: savedWallet?.address || "",
          exists: !!savedWallet,
          net,
          locked: true,
        };
        network.value = config.networks[net as NetworkKey];
        feeRate.value = savedFeeRate;
      });
    }
  }, [saved]);

  if (saved === null) {
    return <></>;
  }

  return <Main />;
}
