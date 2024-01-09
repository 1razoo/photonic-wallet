import { computed, signal } from "@preact/signals-react";
import {
  WalletState,
  BalanceState,
  ElectrumStatus,
  NetworkConfig,
} from "./types";
import config from "./config.json";

export const openModal = signal<{
  modal?: "send" | "receive" | "unlock" | undefined;
  onClose?: (success: boolean) => void;
}>({});
export const openMenu = signal(false);
export const wallet = signal<WalletState>({
  net: "testnet",
  address: "",
  ready: false,
  exists: false,
  locked: true,
});
export const balance = signal<BalanceState>({
  ready: false, // Used to prevent 0 balance showing when loading
  coins: {
    confirmed: 0,
    unconfirmed: 0,
  },
  assets: {
    confirmed: 0,
    unconfirmed: 0,
  },
});
export const electrumStatus = signal<ElectrumStatus>(ElectrumStatus.LOADING);
export const electrumServer = signal("");
export const totalBalance = computed(
  () => balance.value.coins.confirmed + balance.value.coins.unconfirmed
);
export const network = signal<NetworkConfig>(config.networks.testnet);

// Language signal is used to trigger a rerender on the relevant components when the language changes
// Since the language selector is on the wallet settings page, only the sidebar and settings page need to be rerendered
// This allows the simpler t macro to be used instead of the useLingui hook
export const language = signal(config.i18n.defaultLanguage);
