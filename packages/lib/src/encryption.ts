import { scrypt } from "@noble/hashes/scrypt";
import { sha256 } from "@noble/hashes/sha256";

const { crypto } = globalThis;
const { subtle } = crypto;

export type EncryptedData = {
  ciphertext: ArrayBuffer;
  salt: Uint8Array;
  iv: Uint8Array;
  mac: Uint8Array;
};

const scryptParams = {
  dkLen: 32,
  N: 262144,
  r: 8,
  p: 1,
};

export const encrypt = async (
  data: Uint8Array,
  password: string
): Promise<EncryptedData> => {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const derivedKey = await scrypt(
    new TextEncoder().encode(password),
    salt,
    scryptParams
  );
  const importedKey = await subtle.importKey(
    "raw",
    derivedKey.slice(0, 16),
    { name: "AES-CTR", length: 128 },
    false,
    ["encrypt"]
  );
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-CTR",
      counter: iv,
      length: 128,
    },
    importedKey,
    data
  );

  const concat = new Uint8Array(16 + ciphertext.byteLength);
  concat.set(derivedKey.slice(16, 32), 0);
  concat.set(new Uint8Array(ciphertext), 16);

  const mac = sha256(concat);
  return {
    ciphertext,
    salt,
    iv,
    mac,
  };
};

export const decrypt = async (data: EncryptedData, password: string) => {
  const derivedKey = await scrypt(
    new TextEncoder().encode(password),
    data.salt,
    scryptParams
  );

  const concat = new Uint8Array(16 + data.ciphertext.byteLength);
  concat.set(derivedKey.slice(16, 32), 0);
  concat.set(new Uint8Array(data.ciphertext), 16);

  const mac = sha256(concat);

  if (Buffer.compare(Buffer.from(data.mac), Buffer.from(mac)) !== 0) {
    throw new Error("Password incorrect");
  }

  const importedKey = await subtle.importKey(
    "raw",
    derivedKey.slice(0, 16),
    { name: "AES-CTR", length: 128 },
    false,
    ["decrypt"]
  );

  const decrypted = await subtle.decrypt(
    {
      name: "AES-CTR",
      counter: data.iv,
      length: 128,
    },
    importedKey,
    data.ciphertext
  );

  return new Uint8Array(decrypted);
};
