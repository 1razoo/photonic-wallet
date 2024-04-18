/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import type { EncryptedData } from "@lib/encryption";
import { ElectrumUtxo, NetworkKey } from "@lib/types";
import { CreateToastFnReturn } from "@chakra-ui/react";
import { ElectrumTxMap } from "./electrum/worker/buildUpdateTXOs";

export type ScriptGroup = "rxd" | "ref" | "nft" | "ft";

// Type of script subscribed to
export enum ContractType {
  RXD,
  NFT,
  FT,
}

// Type of Atom object (mint operation)
export enum AtomType {
  NFT,
  FT,
  DAT,
}

export interface TxO {
  id?: number;
  txid: string; // Can these be shared with Utxo type?
  vout: number;
  script: string;
  value: number;
  date?: number;
  height?: number;
  spent: 0 | 1;
  change?: 0 | 1;
  contractType: ContractType;
}

export interface SubscriptionStatus {
  scriptHash: string;
  status: string;
}

export interface ContractBalance {
  id: string;
  confirmed: number;
  unconfirmed: number;
}

export interface BlockHeader {
  hash: string;
  height: number;
  buffer: ArrayBuffer;
  reorg: boolean;
}

export interface Atom {
  id?: number;
  atomType: AtomType;
  ref: string;
  lastTxoId?: number;
  revealOutpoint?: string;
  spent: 0 | 1;
  fresh: 0 | 1;
  name: string;
  type: string;
  immutable?: boolean;
  description: string;
  author: string;
  container: string;
  attrs: { [key: string]: string };
  args: { [key: string]: unknown };
  filename?: string;
  fileSrc?: string;
  file?: ArrayBuffer; // TODO save multiple files? Should this go in OPFS or reference the OPFS raw tx?
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
  spent: { id: number; value: number; script: string }[];
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
