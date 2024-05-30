import { wallet } from "./signals";
import { SavedWallet, WalletState } from "./types";

export function unlockWallet(wif: string) {
  wallet.value = { ...wallet.value, wif, locked: false };
}

export function lockWallet() {
  wallet.value = { ...wallet.value, wif: undefined, locked: true };
}

export function loadWalletFromSaved(savedWallet?: SavedWallet) {
  wallet.value = {
    ready: true,
    address: savedWallet?.address || "",
    exists: !!savedWallet,
    net: savedWallet?.net || "testnet",
    locked: true,
  };
}

export function initWallet({
  net,
  wif,
  address,
}: Pick<WalletState, "net" | "wif" | "address">) {
  wallet.value = {
    ...wallet.value,
    locked: false,
    exists: true,
    net,
    wif,
    address,
  };
}
