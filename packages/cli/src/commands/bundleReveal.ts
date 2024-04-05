import fs from "fs";
import path from "path";
import chalk from "chalk";
import { Command } from "commander";
import { ElectrumWS } from "ws-electrumx-client";
import {
  electrumToCoinSel,
  errorMessage,
  decryptWallet,
  readJson,
  resolveDir,
  catchErrors,
  loadWalletFile,
  electrumBroadcast,
  jsonHex,
  g,
  highlight,
} from "../utils";
import type {
  BundlePsbtParams,
  BundleDirectParams,
  CommitFile,
  RevealFile,
  DirectMintFile,
  StateFile,
} from "../types";
import { p2pkhScriptHash } from "@photonic/lib/script";
import { revealDirect, revealPsbt } from "@photonic/lib/mint";
import { Utxo } from "@photonic/lib/types";
import { confirm, password } from "@inquirer/prompts";
import { loadConfig } from "../config";
import ora, { Ora } from "ora";
import { revealFileSchema } from "../schemas";

export default async function bundleReveal(
  this: Command,
  inputDir: string | undefined,
  {
    wallet: walletArg,
    broadcast: broadcastArg,
    revealFile: revealFileArg,
    outputFile: outputFileArg,
    config: configFilename,
  }: {
    wallet: string;
    broadcast: boolean;
    revealFile: string;
    outputFile: string;
    config: string;
  }
) {
  const { log } = console;
  const call = catchErrors(this);

  const bundleDir = resolveDir(inputDir);
  const bundleFilename = path.join(bundleDir, "bundle.json");
  const cacheDir = path.join(bundleDir, "cache");
  const commitFilename = path.join(cacheDir, "commit.json");
  const stateFilename = path.join(cacheDir, "state.json");
  const revealFilename = revealFileArg
    ? resolveDir(revealFileArg)
    : path.join(bundleDir, "reveal.json");
  const outFilename = outputFileArg
    ? resolveDir(outputFileArg)
    : path.join(bundleDir, "mint.json");

  if (!fs.existsSync(bundleFilename)) {
    this.error(errorMessage("bundle.json not found"));
  }

  if (!fs.existsSync(commitFilename)) {
    this.error(
      errorMessage(
        chalk("Commit file not found, please run", highlight("bundle:commit"))
      )
    );
  }

  if (!fs.existsSync(revealFilename)) {
    this.error(errorMessage("Reveal file not found"));
  }

  const revealFileRaw = readJson(
    fs.readFileSync(revealFilename, "utf-8")
  ) as RevealFile;

  // Apply reveal file template
  const { template, tokens: rawParams, ...rest } = revealFileRaw;
  const revealFile: RevealFile = {
    ...rest,
    tokens: Object.fromEntries(
      Object.entries(rawParams).map(([k, v]) => [
        k,
        {
          ...template,
          ...v,
        },
      ])
    ),
  };

  const { error } = revealFileSchema.validate(revealFile, {
    context: { method: revealFile.method },
  });

  if (error) {
    this.error(errorMessage(error.message));
  } else {
    log("reveal.json is valid");
  }

  const walletFile = call(() => loadWalletFile(walletArg));
  const config = call(() => loadConfig(walletFile.net, configFilename));

  const commitFile = readJson(
    fs.readFileSync(commitFilename, "utf-8")
  ) as CommitFile;

  const stateFile = readJson(
    fs.readFileSync(stateFilename, "utf-8")
  ) as StateFile;

  // TODO try other servers when connect fails
  const server = config.servers?.[0];

  if (!server) {
    this.error(errorMessage(`No ${walletFile.net} server configured`));
  }

  const client = new ElectrumWS(server);
  const broadcast = electrumBroadcast(client);
  const progress = ora();

  // Check if reveal already generated
  if (fs.existsSync(outFilename)) {
    if (revealFile.method === "psbt") {
      const regenerate = await confirm({
        message:
          "Output file already exists. Regenerate transactions and overwrite?",
        default: false,
      });
      if (!regenerate) {
        return;
      }
    } else {
      if (broadcastArg === false) {
        log("Output file already exists. This bundle is ready to broadcast.");
      } else {
        const doBroadcast =
          broadcastArg ||
          (await confirm({
            message: "Output file already exists. Broadcast transactions?",
            default: false,
          }));
        if (doBroadcast) {
          const mintFile: DirectMintFile = readJson(
            fs.readFileSync(outFilename, "utf-8")
          );
          await broadcastReveals(progress, broadcast, mintFile);
          fs.writeFileSync(stateFilename, jsonHex(stateFile));
        }
      }
      client.close("");
      return;
    }
  }

  const pw = await password({ message: "Wallet password" });
  const wallet = await decryptWallet(pw, walletFile);
  if (!wallet) {
    this.error(errorMessage("Wallet decryption failed"));
  }

  log(chalk("Wallet unlocked:", highlight(wallet.address)));

  if (revealFile.method === "direct") {
    const connect = ora(`Connecting to ${server}`).start();
    client.on("close", (e) => {
      if (!(e as CloseEvent).wasClean) {
        if (connect.isSpinning) connect.fail(`Could not connect to ${server}`);
        this.error(errorMessage("ElectrumX disconnected"));
      }
    });

    // Get UTXOs for funding
    const unspentRxd: Utxo[] = electrumToCoinSel(
      await client.request(
        "blockchain.scripthash.listunspent",
        p2pkhScriptHash(wallet.address)
      )
    );

    connect.succeed(`Connected to ${server}`);

    const bcRevealFile = revealFile as RevealFile<BundleDirectParams>;
    const revealData = commitFile.commits.flatMap(({ data }) => data);

    const { funding, reveals, fees } = revealDirect(
      wallet.address,
      wallet.wif,
      unspentRxd,
      revealData,
      bcRevealFile.tokens,
      bcRevealFile.batchSize,
      commitFile.delegate?.ref
    );

    const mintFile: DirectMintFile = {
      created: new Date().toISOString(),
      funding,
      reveals,
      fees,
      feeTotal: fees.reduce((a, f) => a + f, 0),
    };

    log(chalk("Saving mint data to", highlight(path.basename(outFilename))));

    fs.writeFileSync(outFilename, jsonHex(mintFile));

    log(`Total transactions: ${mintFile.reveals.length + 1}`);
    log(`Total fees: ${fees.reduce((a, f) => a + f, 0)}`);

    const proceed =
      broadcastArg === false
        ? false
        : broadcastArg === true ||
          (await confirm({ message: "Broadcast transactions?" }));

    if (proceed) {
      await broadcastReveals(progress, broadcast, mintFile);
      fs.writeFileSync(stateFilename, jsonHex(stateFile));
    } else {
      log(g("Reveal transactions ready to broadcast"));
      log(
        "Rerun",
        highlight("bundle:reveal"),
        "to broadcast reveal transactions"
      );
    }
  } else if (revealFile.method === "psbt") {
    const psbtRevealFile = revealFile as RevealFile<BundlePsbtParams>;
    const commitData = commitFile.commits.flatMap((f) => f.data);
    const txs = revealPsbt(wallet.wif, commitData, psbtRevealFile.tokens);
    const result = {
      created: new Date().toISOString(),
      tokens: txs,
    };
    fs.writeFileSync(outFilename, jsonHex(result));
    log(g("Reveal transactions ready"));
    log(
      chalk(
        "Partially signed transactions saved to",
        highlight(path.basename(outFilename))
      )
    );
  }

  client.close("");
}

async function broadcastReveals(
  progress: Ora,
  broadcast: (rawTx: string) => Promise<string>,
  { funding, reveals }: DirectMintFile
) {
  const { log } = console;
  // Broadcast commit
  progress.start("Broadcasting funding");
  await broadcast(funding.toString());
  progress.succeed();
  const commitProgressText = (i: number) =>
    `Broadcasting reveal ${i}/${reveals.length}`;
  progress.start(commitProgressText(0));
  for (const [i, reveal] of reveals.entries()) {
    progress.text = commitProgressText(i + 1);
    await broadcast(reveal.tx.toString());
  }
  progress.succeed();
  log(g("Reveal transactions successfully broadcast!"));
}
