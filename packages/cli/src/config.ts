import fs from "fs";
import { NetworkKey } from "@photonic/lib/types";
import config from "./config.json";
import { readJson, resolveDir } from "./utils";
import { configFileSchema } from "./schemas";
import { Config } from "./types";

// TODO consolidate config.json files across app and cli

function readConfigFile(filename: string) {
  const configPath = resolveDir(filename);

  if (!fs.existsSync(configPath)) {
    throw new Error("Config file not found");
  }

  const configFile = readJson(fs.readFileSync(configPath, "utf-8"), {});

  const { error } = configFileSchema.validate(configFile);
  if (error) {
    throw new Error("Invalid config file");
  }

  return configFile;
}

export function loadConfig(net: NetworkKey, filename?: string): Config {
  const { networks, ...rest } = config;
  const file = filename ? readConfigFile(filename) : {};

  return {
    ...networks[net],
    ...rest,
    ...file[net],
  };
}
