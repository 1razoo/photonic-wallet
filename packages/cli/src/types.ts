import {
  NetworkKey,
  TokenCommitData,
  TokenPsbtParams,
  TokenSendParams,
  Utxo,
} from "@photonic/lib/types";

export type RemoteTokenFile = {
  src: string;
  hash?: boolean | string;
  stamp?: boolean;
};

export type Token = {
  reveal: TokenSendParams | TokenPsbtParams;
  name: string;
  type?: string;
  author?: string;
  license?: string;
  desc?: string;
  authorRefs?: string[];
  containerRefs?: string[];
  files?: {
    [key: string]: RemoteTokenFile | string;
  };
  attrs?: { [key: string]: unknown };
};

export type BundleSendParams = {
  method: "send";
  batchSize: number;
};

export type BundlePsbtParams = {
  method: "psbt";
};

export type BundleFile = {
  commit: { batchSize: number };
  reveal: BundleSendParams | BundlePsbtParams;
  template?: Partial<Token>;
  tokens: Token[];
};

export type StateFile = {
  bundleHash: string;
  broadcast: {
    commit: boolean;
  };
};

export type RevealFile<
  T extends BundleSendParams | BundlePsbtParams =
    | BundleSendParams
    | BundlePsbtParams
> = T & {
  template?: Partial<
    T extends BundleSendParams ? TokenSendParams : TokenPsbtParams
  >;
  tokens: {
    [key: string]: T extends BundleSendParams
      ? TokenSendParams
      : TokenPsbtParams;
  };
};

export type CommitFile = {
  funding: string;
  delegate?: {
    tx: { base: string; mint: string };
    ref: string;
  };
  commits: { txid: string; tx: string; data: TokenCommitData[] }[];
};

export type SendMintFile = {
  created: string;
  funding: string;
  reveals: { txid: string; tx: string; refs: string[] }[];
  fees: number[];
  feeTotal: number;
};

export type PsbtMintFile = {
  created: string;
  tokens: { [key: string]: string };
};

export type WalletFile = {
  ciphertext: string;
  salt: string;
  iv: string;
  mac: string;
  net: NetworkKey;
};

export type Config = {
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
  maxFileSize: number;
  servers: string[];
};

export type DelegateBase = {
  tx: string;
  utxo: Utxo;
  fee: number;
  delegateCsh: string;
};
