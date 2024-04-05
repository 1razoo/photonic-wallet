#!/usr/bin/env node

import { Command } from "commander";
import bundleInit from "./commands/bundleInit";
import bundlePrepare from "./commands/bundlePrepare";
import walletCreate from "./commands/walletCreate";
import walletBalance from "./commands/walletBalance";
import bundleCommit from "./commands/bundleCommit";
import bundleReveal from "./commands/bundleReveal";
import { g } from "./utils";

const { debug, info } = console;
console.debug = console.info = () => undefined;

const program = new Command()
  .name(g("photonic-factory"))
  .description("Mint tokens on the Radiant blockchain")
  .option("-D --debug", "enable debug logging")
  .on("option:debug", () => {
    console.debug = debug;
    console.info = info;
  });

program
  .command("wallet:create <filename>")
  .description("create an encrypted wallet file from a mnemonic phrase")
  .action(walletCreate);

program
  .command("wallet:balance")
  .description("check wallet balance")
  .option("-c --config <configFile>", "use a config file")
  .requiredOption("-w --wallet <walletFile>", "wallet file")
  .action(walletBalance);

program
  .command("bundle:init [bundleDir]")
  .description("interactive bundle file creation")
  .action(bundleInit);

program
  .command("bundle:prepare [bundleDir]")
  .description(
    "prepare tokens for minting; [bundleDir] must contain a bundle.json file"
  )
  .action(bundlePrepare);

/*program
  .command("bundle:preview [bundleDir]")
  .description("preview prepared tokens in your browser")
  .action(bundlePrepare);*/

program
  .command("bundle:commit [bundleDir]")
  .description(
    "generate commit transactions for a bundle of tokens; [bundleDir] must contain tokens prepared with the bundle:prepare command"
  )
  .option("-b --broadcast", "broadcast transactions; skips broadcast prompt")
  .option(
    "-n --no-broadcast",
    "don't broadcast transactions; skips broadcast prompt"
  )
  .option("-c --config <configFile>", "use a config file")
  .requiredOption("-w --wallet <walletFile>", "wallet file")
  .action(bundleCommit);

program
  .command("bundle:reveal [bundleDir]")
  .description(
    "create reveal transactions for a bundle of tokens; [bundleDir] must contain tokens committed with the bundle:commit command"
  )
  .option(
    "-r --reveal-file <revealFile>",
    "use reveal parameters from revealFile (default is reveal.json)"
  )
  .option(
    "-o --output-file <outputFile>",
    "write transaction data to outputFile (default is mint.json)"
  )
  .option(
    "-b --broadcast",
    "broadcast transactions; skips broadcast prompt; only applies to 'send' reveal method"
  )
  .option(
    "-n --no-broadcast",
    "don't broadcast transactions; skips broadcast prompt; only applies to 'send' reveal method"
  )
  .option("-c --config <configFile>", "use a config file")
  .requiredOption("-w --wallet <walletFile>", "wallet file")
  .action(bundleReveal);

program.parse(process.argv);
