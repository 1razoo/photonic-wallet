/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { Transaction } from "@radiantblockchain/radiantjs";
import { EncryptedData } from "./wallet/encrypt";

export type ScriptGroup = "rxd" | "ref" | "nft" | "ft";

export type Utxo = {
  tx_hash: string;
  tx_pos: number;
  height: number;
  value: number;
};

export type ElectrumTxResponse = {
  hex: string;
  hash: string;
  time: number;
};

export type ElectrumHeaderResponse = {
  height: number;
  hex: string;
};

export type ElectrumHeadersResponse = {
  count: number;
  hex: string;
  max: number;
};

export enum ContractType {
  RXD,
  REF,
  NFT,
  FT,
}

type TxSpent = 0 | 1;

export interface TxO {
  id?: number;
  txid: string;
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
  spent: TxSpent;
  fresh: TxSpent;
  main?: string;
  name: string;
  type: string;
  description: string;
  author: string;
  container: string;
  attrs: { [key: string]: string };
  filename?: string;
  file?: ArrayBuffer;
  hash?: ArrayBuffer;
  hashstamp?: ArrayBuffer;
  height?: number;
}

export type AtomPayload = {
  meta: {
    [key: string]: unknown;
  };
  args: {
    [key: string]: unknown;
  };
  ctx: {
    [key: string]: unknown;
  };
  in: unknown[];
  by: unknown[];
};

export interface Subscription {
  register(address: string): void;
}

export type ElectrumCallback = (...payload: unknown[]) => unknown;

type NewTxMap = { [key: string]: { raw: any; tx: Transaction } };
export type ElectrumStatusUpdate = (
  scriptHash: string,
  newStatus: string
) => Promise<{
  added: TxO[];
  confs: Map<number, Utxo>;
  newTxs?: NewTxMap;
  spent: number[];
}>;

export type SavedWallet = EncryptedData & { address: string; net: NetworkKey };

export type NetworkKey = "mainnet" | "testnet";

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
