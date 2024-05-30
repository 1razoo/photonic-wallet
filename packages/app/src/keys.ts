import { Buffer } from "buffer";
import { Networks, PrivateKey } from "@radiantblockchain/radiantjs";
import {
  generateMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
  entropyToMnemonic,
} from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import { wordlist } from "@scure/bip39/wordlists/english";
import { EncryptedData, decrypt, encrypt } from "@lib/encryption";
import db from "@app/db";
import { NetworkKey } from "@lib/types";

const derivationPath = "m/44'/0'/0'/0/0";

export async function decryptKeys(net: NetworkKey, password: string) {
  const data = (await db.kvp.get("wallet")) as EncryptedData;
  if (!data) {
    throw new Error("Failed to unlock");
  }
  const decrypted = await decrypt(data, password);
  const mnemonic = entropyToMnemonic(decrypted, wordlist);
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const key = Buffer.from(
    hdKey.derive(derivationPath).privateKey as Uint8Array
  ).toString("hex");
  if (!key) {
    throw new Error("Invalid mnemonic phrase");
  }
  const privKey = new PrivateKey(key, Networks[net]);
  const address = privKey?.toAddress().toString() as string;

  return {
    net,
    mnemonic,
    privKey,
    wif: privKey.toString(),
    address,
    locked: false,
  };
}

export async function createKeys(net: NetworkKey, password: string) {
  const mnemonic = generateMnemonic(wordlist);
  return recoverKeys(net, mnemonic, password);
}

export async function recoverKeys(
  net: NetworkKey,
  mnemonic: string,
  password: string
) {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const key = Buffer.from(
    hdKey.derive(derivationPath).privateKey as Uint8Array
  ).toString("hex");
  if (!key) return;
  const privKey = new PrivateKey(key, Networks[net]);
  const address = privKey?.toAddress().toString() as string;
  const entropy = mnemonicToEntropy(mnemonic, wordlist);
  await db.kvp.put(
    { ...(await encrypt(entropy, password)), address, net: net },
    "wallet"
  );

  return decryptKeys(net, password);
}

export async function keysExist(): Promise<boolean> {
  return !!(await db.kvp.get("wallet"));
}
