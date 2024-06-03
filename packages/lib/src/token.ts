/* eslint-disable @typescript-eslint/ban-ts-comment */
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { decode, encode } from "cbor-x";
// @ts-ignore
import rjs from "@radiantblockchain/radiantjs";
import {
  SmartTokenEmbeddedFile,
  SmartTokenFile,
  SmartTokenPayload,
  SmartTokenRemoteFile,
} from "./types";
import { bytesToHex } from "@noble/hashes/utils";
import { pushMinimalAsm } from "./script";

// ESM compatibility
const { Script } = rjs;
type Script = rjs.Script;

export const rstHex = "72633032"; // rc02
//export const rstHex = ""; // rst
export const rstBuffer = Buffer.from(rstHex, "hex");

const toObject = (obj: unknown) =>
  typeof obj === "object" ? (obj as { [key: string]: unknown }) : {};

const filterFileObj = (
  obj: SmartTokenFile
): { embed?: SmartTokenEmbeddedFile; remote?: SmartTokenRemoteFile } => {
  const embed = obj as Partial<SmartTokenEmbeddedFile>;
  if (typeof embed.t === "string" && embed.b instanceof Uint8Array) {
    return { embed: { t: embed.t, b: embed.b } };
  }
  const remote = obj as Partial<SmartTokenRemoteFile>;
  if (
    typeof remote.src === "string" &&
    (remote.h === undefined || remote.h instanceof Uint8Array) &&
    (remote.hs === undefined || remote.hs instanceof Uint8Array)
  ) {
    return { remote: { src: remote.src, h: remote.h, hs: remote.hs } };
  }
  return {};
};

export type DecodedRst = {
  operation: string;
  payload: SmartTokenPayload;
  embeddedFiles: { [key: string]: SmartTokenEmbeddedFile };
  remoteFiles: { [key: string]: SmartTokenRemoteFile };
};

export function decodeRst(script: Script): undefined | DecodedRst {
  let result: { operation?: string; payload: object } = {
    operation: undefined,
    payload: {},
  };
  (
    script.chunks as {
      opcodenum: number;
      buf?: Uint8Array;
    }[]
  ).some(({ opcodenum, buf }, index) => {
    if (
      !buf ||
      opcodenum !== 4 ||
      Buffer.from(buf).toString("hex") !== rstHex ||
      script.chunks.length <= index + 2
    ) {
      return false;
    }

    const operation = script.chunks[index + 1];
    const payload = script.chunks[index + 2];
    if (
      (operation.opcodenum !== 2 && operation.opcodenum !== 3) ||
      !operation.buf ||
      !payload.buf
    ) {
      return false;
    }
    const decoded = decode(Buffer.from(payload.buf));
    if (!decoded) {
      return false;
    }

    result = {
      operation: Buffer.from(operation.buf).toString(),
      payload: decoded,
    };
    return true;
  });

  if (!result.operation || !["nft", "ft", "dat"].includes(result.operation))
    return undefined;

  const { attrs, ...rest } = result.payload as {
    [key: string]: unknown;
  };

  // Separate files from root object
  const { meta, embeds, remotes } = Object.entries(rest).reduce<{
    meta: [string, unknown][];
    embeds: [string, unknown][];
    remotes: [string, unknown][];
  }>(
    (a, [k, v]) => {
      const { embed, remote } = filterFileObj(
        v as { t: string; b: Uint8Array }
      );
      if (embed) {
        a.embeds.push([k, embed]);
      } else if (remote) {
        a.remotes.push([k, remote]);
      } else {
        a.meta.push([k, v]);
      }
      return a;
    },
    { meta: [], embeds: [], remotes: [] }
  );

  return {
    operation: result.operation,
    payload: {
      attrs: toObject(attrs),
      ...Object.fromEntries(meta),
    },
    embeddedFiles: Object.fromEntries(embeds) as {
      [key: string]: SmartTokenEmbeddedFile;
    },
    remoteFiles: Object.fromEntries(remotes) as {
      [key: string]: SmartTokenRemoteFile;
    },
  };
}

export function encodeRst(
  operation: string,
  payload: unknown
): { operation: string; script: string; payloadHash: string } {
  const encodedPayload = encode(payload);
  return {
    operation,
    script: new Script()
      .add(rstBuffer)
      .add(Buffer.from(operation))
      .add(encodedPayload)
      .toHex(),
    payloadHash: bytesToHex(sha256(sha256(Buffer.from(encodedPayload)))),
  };
}

export function encodeRstMutable(
  operation: "mod" | "sl",
  payload: unknown,
  contractOutputIndex: number,
  refHashIndex: number,
  refIndex: number,
  tokenOutputIndex: number
) {
  const opHex = Buffer.from(operation).toString("hex");
  const encodedPayload = encode(payload);
  const asm = `${rstHex} ${opHex} ${encodedPayload.toString(
    "hex"
  )} ${pushMinimalAsm(contractOutputIndex)} ${pushMinimalAsm(
    refHashIndex
  )} ${pushMinimalAsm(refIndex)} ${pushMinimalAsm(tokenOutputIndex)}`;
  const script = Script.fromASM(asm);
  const scriptSigHash = bytesToHex(sha256(script.toBuffer()));
  const payloadHash = bytesToHex(sha256(sha256(Buffer.from(encodedPayload))));

  return {
    script,
    payloadHash,
    scriptSigHash,
  };
}

export function isImmutableToken(payload: SmartTokenPayload) {
  // Default to immutable if arg.i isn't given
  return payload.i !== undefined ? payload.i === true : true;
}

// Filter for attr objects
export function filterAttrs(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) =>
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    )
  );
}
