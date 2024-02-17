import { Command } from "commander";
import fs from "fs";
import { password, select } from "@inquirer/prompts";
import { bytesToHex } from "@noble/hashes/utils";
import { encrypt } from "@photonic/lib/encryption";
import { tryMnemonic } from "@photonic/lib/wallet";
import { errorMessage, g, resolveDir } from "../utils";

const { log } = console;

export default async function walletCreate(
  this: Command,
  inputFilename: string
) {
  if (!inputFilename.endsWith(".json")) {
    this.error(errorMessage("Wallet filename must end with .json"));
  }

  const walletFilename = resolveDir(inputFilename);

  const net = await select({
    message: "Network",
    choices: [
      { name: "mainnet", value: "mainnet" },
      { name: "testnet", value: "testnet" },
    ],
  });

  const mnemonic = await password({ message: "Enter mnemonic phrase" });
  const pw = await password({ message: "Password" });
  const confirm = await password({ message: "Confirm password" });

  if (pw !== confirm) {
    this.error(errorMessage("Passwords do not match"));
  }

  try {
    await tryMnemonic(mnemonic);
    const encrypted = await encrypt(new TextEncoder().encode(mnemonic), pw);
    const hex = {
      ciphertext: bytesToHex(new Uint8Array(encrypted.ciphertext)),
      salt: bytesToHex(encrypted.salt),
      iv: bytesToHex(encrypted.iv),
      mac: bytesToHex(encrypted.mac),
      net,
    };

    fs.writeFileSync(walletFilename, JSON.stringify(hex, undefined, 2));
  } catch (error) {
    this.error(
      errorMessage((error as Error).message || "Wallet creation failed")
    );
  }

  log(g("Wallet file created!"));
}
