import {
  TokenContractType,
  NetworkKey,
  RevealPsbtParams,
  RevealDirectParams,
  Utxo,
  TokenMint,
} from "@photonic/lib/types";

export type RemoteTokenFile = {
  src: string;
  contentType?: string;
  hash?: boolean | string;
  stamp?: boolean;
};

export type EmbeddedTokenFile = {
  contentType?: string;
  path: string;
};

type BundleTokenBase = {
  reveal: RevealDirectParams | RevealPsbtParams;
  name: string;
  type?: string;
  author?: string;
  license?: string;
  desc?: string;
  authorRefs?: string[];
  containerRefs?: string[];
  files?: {
    [key: string]: RemoteTokenFile | EmbeddedTokenFile;
  };
  attrs?: { [key: string]: unknown };
};

export type BundleTokenNft = BundleTokenBase & {
  contract: Extract<TokenContractType, "nft" | "dat">;
};

export type BundleTokenFt = BundleTokenBase & {
  contract: Extract<TokenContractType, "ft">;
  ticker: string;
  supply: number;
};

export type BundleDirectParams = {
  method: "direct";
  batchSize: number;
};

export type BundlePsbtParams = {
  method: "psbt";
};

export type BundleFile = {
  commit: { batchSize: number };
  reveal: BundleDirectParams | BundlePsbtParams;
  template?: Partial<BundleTokenNft | BundleTokenFt>;
  tokens: (BundleTokenNft | BundleTokenFt)[];
};

export type StateFile = {
  bundleHash: string;
  broadcast: {
    commit: boolean;
  };
};

export type RevealFile<
  T extends BundleDirectParams | BundlePsbtParams =
    | BundleDirectParams
    | BundlePsbtParams
> = T & {
  template?: Partial<
    T extends BundleDirectParams ? RevealDirectParams : RevealPsbtParams
  >;
  tokens: {
    [key: string]: T extends BundleDirectParams
      ? RevealDirectParams
      : RevealPsbtParams;
  };
};

export type CommitFile = {
  funding: string;
  delegate?: {
    tx: { base: string; mint: string };
    ref: string;
  };
  commits: { txid: string; tx: string; data: TokenMint[] }[];
};

export type DirectMintFile = {
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
