// ESM compatibility
import rjs from "@radiantblockchain/radiantjs";

export type NetworkKey = "mainnet" | "testnet";

export type Wallet = {
  privKey: rjs.PrivateKey;
  wif: string;
  address: string;
};

export type TokenSendParams = {
  address: string;
};

export type TokenPsbtParams = {
  photons: number;
  address: string;
};

export type TokenRevealParams = TokenSendParams | TokenPsbtParams;

export type AtomPayload = {
  args: {
    [key: string]: unknown;
  };
  ctx: {
    [key: string]: unknown;
  };
  in?: Uint8Array[];
  by?: Uint8Array[];
  [key: string]: unknown;
};

export type AtomRemoteFile = {
  src: string;
  h?: Uint8Array;
  hs?: Uint8Array;
};

export type AtomFile = Uint8Array | AtomRemoteFile;

// Unsigned inputs are used for fee calcualtion and do not yet have a script sig
// Maybe there is a better name for this...
export type UnfinalizedInput = Utxo & {
  scriptSigSize?: number;
};

// Unsigned outputs are used for fee calcualtion and do not yet contain a txid and vout
// Maybe there is a better name for this...
export type UnfinalizedOutput = {
  script: string;
  value: number;
};

export type Utxo = {
  txid: string;
  vout: number;
  script: string;
  value: number;
};

export type ElectrumUtxo = {
  tx_hash: string;
  tx_pos: number;
  height: number;
  value: number;
};

export type ElectrumRefResponse = [
  { tx_hash: string; height: number },
  { tx_hash: string; height: number }
];

export type ElectrumTxResponse = {
  hex: string;
  hash: string;
  time: number;
};

export type ElectrumBalanceResponse = {
  confirmed: number;
  unconfirmed: number;
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

export type TokenCommitData = {
  utxo: {
    txid: string;
    vout: number;
    script: string;
    value: number;
  };
  immutable: boolean;
  atom: { script: string; payloadHash: string };
};

export default {};
