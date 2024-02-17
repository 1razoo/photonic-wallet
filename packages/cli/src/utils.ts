import fs from "fs";
import chalk from "chalk";
import gradient from "gradient-string";
import sharp from "sharp";
import merge from "deepmerge";
import path from "path";
import type { ElectrumUtxo, Utxo } from "@photonic/lib/types";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { walletFromMnemonic } from "@photonic/lib/wallet";
import { decrypt } from "@photonic/lib/encryption";
import { WalletFile } from "./types";
import { walletFileSchema } from "./schemas";
import { Command } from "commander";
import { ElectrumWS } from "ws-electrumx-client";
import ora from "ora";

const symbols = {
  info: chalk.blue("ℹ"),
  success: chalk.green("✔"),
  warning: chalk.yellow("⚠"),
  error: chalk.red("✖"),
};

export const ipfsUrl = (url: string) => {
  return "https://{cid}.ipfs.nftstorage.link".replace(
    "{cid}",
    url.replace("ipfs://", "")
  );
};

export const errorMessage = (message: string) => chalk.redBright(message);

export const successMessage = (message: string) =>
  chalk(chalk.greenBright(symbols.success), message);

export const g = (message: string) =>
  chalk.bold(gradient("#0091ea", "#d500f9")(message));

export const createHashStamp = (img: ArrayBuffer) => {
  try {
    return sharp(img)
      .resize(64, 64, { fit: "inside" })
      .flatten() // TODO do we need a background colour?
      .webp({ quality: 20, alphaQuality: 20 })
      .toBuffer();
  } catch {
    throw new Error("HashStamp creation failed");
  }
};

export const combineMerge = (target: any, source: any, options: any) => {
  const destination = target.slice();

  source.forEach((item: any, index: number) => {
    if (typeof destination[index] === "undefined") {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

export const readJson = (str: string, defaultValue: unknown = {}) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// Convert UTXO objects from ElectrumX format to coinselect
export const electrumToCoinSel = (utxos: ElectrumUtxo[]): Utxo[] =>
  utxos.map((utxo) => ({
    txid: utxo.tx_hash,
    vout: utxo.tx_pos,
    script: "",
    value: utxo.value,
  }));

export const resolveDir = (dir?: string) => {
  const cwd = process.env.INIT_CWD || process.cwd();
  if (!dir) return cwd;
  return path.isAbsolute(dir) ? dir : path.resolve(cwd, dir);
};

export const jsonHex = (obj: unknown) =>
  JSON.stringify(
    obj,
    (_, value) => {
      if (value instanceof Uint8Array) return bytesToHex(value);
      // JSON.stringify converts Buffer to { type: "Buffer", data: [] } so convert back to Buffer then to hex
      if (value?.type === "Buffer") return bytesToHex(Buffer.from(value));
      return value;
    },
    2
  );

export const decryptWallet = async (pw: string, walletFile: WalletFile) => {
  try {
    return walletFromMnemonic(
      new TextDecoder("utf-8").decode(
        await decrypt(
          {
            ciphertext: hexToBytes(walletFile.ciphertext),
            salt: hexToBytes(walletFile.salt),
            iv: hexToBytes(walletFile.iv),
            mac: hexToBytes(walletFile.mac),
          },
          pw
        )
      ),
      walletFile.net
    );
  } catch (error) {
    return undefined;
  }
};

export const loadWalletFile = (inputWallet: string) => {
  const walletFilename = resolveDir(inputWallet);

  if (!fs.existsSync(walletFilename)) {
    throw new Error("Wallet not found");
  }

  const walletFile = readJson(
    fs.readFileSync(walletFilename, "utf-8"),
    {}
  ) as WalletFile;

  const { error } = walletFileSchema.validate(walletFile);

  if (error) {
    throw new Error("Invalid wallet file");
  }

  return walletFile;
};

// Handle errors when assigning a return value to a const
export const catchErrors =
  (cmd: Command) =>
  <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (error) {
      if ((error as Error).message) {
        cmd.error(errorMessage((error as Error).message));
      } else {
        throw error;
      }
    }
  };

export const electrumBroadcast =
  (client: ElectrumWS) =>
  async (rawTx: string): Promise<string> => {
    try {
      const result = (await client.request(
        "blockchain.transaction.broadcast",
        rawTx
      )) as string;
      return result;
    } catch (error) {
      if (
        (error as Error).message?.includes("transactionalreadyinblockchain")
      ) {
        return "";
      }
      throw error;
    }
  };

export const countdown = (message: string, seconds = 5) => {
  let n = seconds;
  const text = () => `${message} ${n}... [press Ctrl+C to cancel]`;
  const progress = ora(text()).start();
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      n--;
      progress.text = text();
      if (n === 0) {
        progress.succeed();
        clearInterval(timer);
        resolve(true);
      }
    }, 1000);
  });
};

export const highlight = chalk.bgBlack.whiteBright;
export const danger = chalk.bgRed.whiteBright;
