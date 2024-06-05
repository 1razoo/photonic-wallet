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
import { RST_MUT, RST_NFT } from "./protocols";

// ESM compatibility
const { Script } = rjs;
type Script = rjs.Script;

export const rstHex = "726333"; // rc3
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
    typeof remote.u === "string" &&
    (remote.h === undefined || remote.h instanceof Uint8Array) &&
    (remote.hs === undefined || remote.hs instanceof Uint8Array)
  ) {
    return {
      remote: {
        t: typeof remote.t === "string" ? remote.t : "",
        u: remote.u,
        h: remote.h,
        hs: remote.hs,
      },
    };
  }
  return {};
};

export type DecodedRst = {
  payload: SmartTokenPayload;
  embeddedFiles: { [key: string]: SmartTokenEmbeddedFile };
  remoteFiles: { [key: string]: SmartTokenRemoteFile };
};

export function decodeRst(script: Script): undefined | DecodedRst {
  const result: { payload: object } = {
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
      opcodenum !== 3 ||
      Buffer.from(buf).toString("hex") !== rstHex ||
      script.chunks.length <= index + 1
    ) {
      return false;
    }

    const payload = script.chunks[index + 1];
    if (!payload.buf) {
      return false;
    }
    const decoded = decode(Buffer.from(payload.buf));
    if (!decoded) {
      return false;
    }

    result.payload = decoded;
    return true;
  });

  const { p, attrs, ...rest } = result.payload as {
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
    payload: {
      p: Array.isArray(p)
        ? p.filter((v) => ["string", "number"].includes(typeof v))
        : [],
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

export function encodeRst(payload: unknown) {
  const encodedPayload = encode(payload);
  return {
    revealScriptSig: new Script().add(rstBuffer).add(encodedPayload).toHex(),
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
  const asm = `${rstHex} ${encodedPayload.toString(
    "hex"
  )} ${opHex} ${pushMinimalAsm(contractOutputIndex)} ${pushMinimalAsm(
    refHashIndex
  )} ${pushMinimalAsm(refIndex)} ${pushMinimalAsm(tokenOutputIndex)}`;
  const scriptSig = Script.fromASM(asm);
  const scriptSigHash = bytesToHex(sha256(scriptSig.toBuffer()));
  const payloadHash = bytesToHex(sha256(sha256(Buffer.from(encodedPayload))));

  return {
    scriptSig,
    payloadHash,
    scriptSigHash,
  };
}

export function isImmutableToken({ p }: SmartTokenPayload) {
  // Mutable tokens must be NFTs that implement the mutable contract
  return !(p.includes(RST_NFT) && p.includes(RST_MUT));
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

// Find token script for a ref in reveal inputs and decode if found
export function extractRevealPayload(
  ref: string,
  inputs: rjs.Transaction.Input[]
) {
  const refTxId = ref.substring(0, 64);
  const refVout = parseInt(ref.substring(64), 10);

  // Find token script in the reveal tx
  const revealIndex = inputs.findIndex((input) => {
    return (
      input.prevTxId.toString("hex") === refTxId &&
      input.outputIndex === refVout
    );
  });
  const script = revealIndex >= 0 && inputs[revealIndex].script;

  if (!script) {
    return { revealIndex: -1 };
  }

  return { revealIndex, rst: decodeRst(script) };
}
