import fs from "fs";
import chalk from "chalk";
import { Command } from "commander";
import { ElectrumWS } from "ws-electrumx-client";
import {
  catchErrors,
  decryptWallet,
  errorMessage,
  highlight,
  readJson,
  resolveDir,
} from "../utils";
import type { WalletFile } from "../types";
import { walletFileSchema } from "../schemas";
import { photonsToRXD } from "@photonic/lib";
import { p2pkhScriptHash } from "@photonic/lib/script";
import { password } from "@inquirer/prompts";
import { loadConfig } from "../config";
import ora from "ora";

export default async function walletBalance(
  this: Command,
  {
    wallet: walletArg,
    config: configFilename,
  }: { wallet: string; config: string }
) {
  const call = catchErrors(this);
  const { log } = console;

  const walletFilename = resolveDir(walletArg);
  const walletFile = readJson(
    fs.readFileSync(walletFilename, "utf-8"),
    {}
  ) as WalletFile;
  const config = call(() => loadConfig(walletFile.net, configFilename));
  const { error: walletError } = walletFileSchema.validate(walletFile);

  if (walletError) {
    this.error(errorMessage("Invalid wallet file"));
  }

  const pw = await password({ message: "Wallet password" });
  const wallet = await decryptWallet(pw, walletFile);
  if (!wallet) {
    this.error(errorMessage("Wallet decryption failed"));
  }

  log(chalk("Wallet unlocked:", highlight(wallet.address)));

  const server = config.servers?.[0];

  if (!server) {
    this.error(errorMessage(`No ${walletFile.net} server configured`));
  }

  const connect = ora(`Connecting to ${server}`).start();
  const client = new ElectrumWS(server);
  client.on("close", (e) => {
    if (!(e as CloseEvent).wasClean) {
      if (connect.isSpinning) connect.fail(`Could not connect to ${server}`);
      this.error(errorMessage("ElectrumX disconnected"));
    }
  });

  // Get UTXOs for funding
  const balance = (await client.request(
    "blockchain.scripthash.get_balance",
    p2pkhScriptHash(wallet.address)
  )) as { confirmed: number; unconfirmed: number };
  connect.succeed(`Connected to ${server}`);

  log(chalk("Address:", highlight(wallet.address)));
  log(
    chalk(
      "Confirmed:",
      highlight(photonsToRXD(balance.confirmed)),
      config.ticker
    )
  );
  log(
    chalk(
      "Unconfirmed:",
      highlight(photonsToRXD(balance.unconfirmed)),
      config.ticker
    )
  );
  log(
    chalk(
      "Total:",
      highlight(photonsToRXD(balance.confirmed + balance.unconfirmed)),
      config.ticker
    )
  );

  client.close("");
}
