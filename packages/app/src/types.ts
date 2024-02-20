/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import type { EncryptedData } from "@lib/encryption";
import { ElectrumUtxo, NetworkKey } from "@lib/types";
import { ElectrumTxMap } from "./subscriptions/buildUpdateTXOs";
import { CreateToastFnReturn } from "@chakra-ui/react";

export type ScriptGroup = "rxd" | "ref" | "nft" | "ft";

export enum ContractType {
  RXD,
  REF,
  NFT,
  FT,
}

type TxSpent = 0 | 1;

export interface TxO {
  id?: number;
  txid: string; // Can these be shared with Utxo type?
  vout: number;
  script: string;
  value: number;
  date?: number;
  height?: number;
  spent: TxSpent;
  contractType: ContractType;
}

export interface BlockHeader {
  hash: string;
  height: number;
  buffer: ArrayBuffer;
  reorg: boolean;
}

export interface AtomNft {
  id?: number;
  ref: string;
  lastTxoId?: number;
  revealOutpoint?: string;
  spent: TxSpent;
  fresh: TxSpent;
  main?: string; // TODO It would be good to rename this
  name: string;
  type: string;
  immutable?: boolean;
  description: string;
  author: string;
  container: string;
  attrs: { [key: string]: string };
  filename?: string;
  file?: ArrayBuffer; // TODO save multiple files?
  hash?: ArrayBuffer;
  hashstamp?: ArrayBuffer;
  height?: number;
}

export interface Subscription {
  // Provide toast to subscription so user can be notified
  register(address: string, toast: CreateToastFnReturn): void;
}

export type ElectrumCallback = (...payload: unknown[]) => unknown;

export type ElectrumStatusUpdate = (
  scriptHash: string,
  newStatus: string
) => Promise<{
  added: TxO[];
  confs: Map<number, ElectrumUtxo>;
  newTxs?: ElectrumTxMap;
  spent: { id: number; value: number }[];
}>;

export type SavedWallet = EncryptedData & { address: string; net: NetworkKey };

export interface WalletState {
  net: NetworkKey;
  ready: boolean;
  exists: boolean;
  locked: boolean;
  wif?: string;
  address: string;
}

export interface BalanceState {
  ready: boolean;
  coins: {
    confirmed: number;
    unconfirmed: number;
  };
  assets: {
    confirmed: number;
    unconfirmed: number;
  };
}

export enum ElectrumStatus {
  LOADING,
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

export type NetworkConfig = {
  name: string;
  ticker: string;
  anchor: {
    height: number;
    bits: number;
    prevTime: number;
  };
  explorer: {
    tx: string;
  };
};

export {};
