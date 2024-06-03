import path from "path";
import mime from "mime";
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import ora from "ora";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import merge from "deepmerge";
import {
  catchErrors,
  combineMerge,
  countdown,
  createHashStamp,
  danger,
  errorMessage,
  g,
  highlight,
  ipfsUrl,
  jsonHex,
  readJson,
  resolveDir,
} from "../utils";
import type {
  BundleFile,
  EmbeddedTokenFile,
  RemoteTokenFile,
  StateFile,
} from "../types";
import { bundleFileSchema } from "../schemas";
import { rimraf } from "rimraf";
import { loadConfig } from "../config";
import { confirm } from "@inquirer/prompts";

const { log } = console;

const fetchProgressText = (n: number, t: number) =>
  `Processing images (${n}/${t})`;

export default async function bundlePrepare(this: Command, inputDir?: string) {
  const call = catchErrors(this);
  const config = call(() => loadConfig("testnet"));
  const bundleDir = resolveDir(inputDir);
  const filename = path.join(bundleDir, "bundle.json");
  const cacheDir = path.join(bundleDir, "cache");
  const commitFilename = path.join(cacheDir, "commit.json");
  if (!fs.existsSync(filename)) {
    this.error(errorMessage("bundle.json not found"));
  }
  const text = fs.readFileSync(filename, "utf-8");
  const bundleFileHash = bytesToHex(sha256(text));
  const bundle = readJson(text) as BundleFile;
  const method = bundle.reveal?.method || "broadcast";

  if (fs.existsSync(commitFilename)) {
    const proceed = await confirm({
      message: chalk(
        danger("WARNING:"),
        "This bundle has already been committed. Preparing will clear all data and any committed tokens may be unrecoverable! Are you sure you want to continue?"
      ),
      default: false,
    });

    if (!proceed) {
      return;
    }

    await countdown("Preparing in", 5);
  }

  try {
    const { error } = bundleFileSchema.validate(bundle, {
      context: { prepared: false, method },
    });

    if (error) {
      this.error(errorMessage(error.message));
    } else {
      log("bundle.json is valid");
    }

    const { template, ...prepared } = bundle;

    // Apply template object
    if (template) {
      prepared.tokens = prepared.tokens.map((item) =>
        merge(template, item, { arrayMerge: combineMerge })
      );

      // Validate again to be sure template is correctly applied
      const { error } = bundleFileSchema.validate(prepared, {
        context: { prepared: true, method },
      });

      if (error) {
        this.error(errorMessage(`Faild to apply template; ${error.message}`));
      } else {
        log("Template applied");
      }
    }

    // Recreate cache dir
    rimraf.sync(cacheDir);
    fs.mkdirSync(cacheDir, { recursive: true });

    // Get all token files
    const allFiles = prepared.tokens.flatMap((t) =>
      Object.values(t.files || {})
    );
    const fileCount = allFiles.length;
    const progress = ora(fetchProgressText(0, fileCount)).start();
    let done = 0;

    const fetchFile = async (src: string) => {
      const file = await fetch(src.startsWith("ipfs://") ? ipfsUrl(src) : src);
      if (file.status === 200) {
        return await file.arrayBuffer();
      }
      progress.fail(chalk(chalk.red.bold("Fetch failed"), src)).start();
      return new ArrayBuffer(0);
    };

    // Cache for any files used for multiple tokens
    const hashCache: { [key: string]: string } = {};
    try {
      for (const tokenFile of allFiles) {
        const isRemote = !!(tokenFile as RemoteTokenFile)?.src;
        if (isRemote) {
          // Generate hash and HashStamp for remote file
          const remoteFile = tokenFile as RemoteTokenFile;
          // If hash is true, generate hash, otherwise use the string already provided
          const doHash = remoteFile.hash === true;
          if (doHash || remoteFile.stamp) {
            if (!hashCache[remoteFile.src]) {
              const file = await fetchFile(remoteFile.src);
              const hashProvided = typeof remoteFile.hash === "string";
              const hash = hashProvided
                ? (remoteFile.hash as string)
                : bytesToHex(sha256(new Uint8Array(file)));
              if (remoteFile.stamp) {
                const srcHash = bytesToHex(sha256(remoteFile.src));
                const stamp = await createHashStamp(file);
                fs.writeFileSync(
                  path.join(cacheDir, `hs.${srcHash}.webp`),
                  stamp
                );
              }
              hashCache[remoteFile.src] = hash;
            }
            if (doHash) {
              remoteFile.hash = hashCache[remoteFile.src];
            }
          }
        } else {
          const embed = tokenFile as EmbeddedTokenFile;
          if (
            fs.statSync(path.join(bundleDir, embed.path)).size >
            config.maxFileSize
          ) {
            throw new Error(`File '${embed.path}' is too large`);
          }
          if (!embed.contentType) {
            const contentType = mime.getType(embed.path);
            embed.contentType = contentType || "application/octet-stream";
          }
        }
        done++;
        progress.text = fetchProgressText(done, fileCount);
      }

      // Store bundleFileHash so mint command can confirm data is valid for the bundle file
      fs.writeFileSync(
        path.join(cacheDir, "state.json"),
        jsonHex({
          bundleHash: bundleFileHash,
          broadcast: {
            commit: false,
          },
        } as StateFile)
      );

      fs.writeFileSync(
        path.join(cacheDir, "bundle-lock.json"),
        JSON.stringify(prepared, undefined, 2)
      );
      fs.writeFileSync(
        path.join(cacheDir, "DO_NOT_MODIFY"),
        "Contents of this directory are auto-generated. Modifying could result in token corruption.\n\nThis directory will be deleted and recreated with a bundle:prepare command.\n"
      );

      if (done === fileCount) {
        progress.succeed();
      } else {
        progress.fail();
        this.error(errorMessage("Could not process images"));
      }
    } catch (error) {
      progress.fail();
      throw error;
    }
  } catch (error) {
    this.error(errorMessage((error as Error).message));
  }
  log(g("Successfully prepared!"));
  log(chalk("Please review contents of", highlight("cache")));
  log(
    chalk("Commit your tokens with the", highlight("bundle:commit"), "command")
  );
}
