/* eslint-disable @typescript-eslint/ban-ts-comment */
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { decode, encode } from "cbor-x";
// @ts-ignore
import rjs from "@radiantblockchain/radiantjs";
import { SmartTokenFile, SmartTokenPayload } from "./types";
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

export type DecodedRst = {
  operation: string;
  payload: SmartTokenPayload;
  files: { [key: string]: SmartTokenFile };
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

  const { args, ctx, attrs, ...rest } = result.payload as {
    [key: string]: unknown;
  };

  // Separate meta and file fields from root object
  const { meta, files } = Object.entries(rest).reduce<{
    meta: [string, unknown][];
    files: [string, unknown][];
  }>(
    (a, [k, v]) => {
      a[k.indexOf(".") > 0 ? "files" : "meta"].push([k, v]);
      return a;
    },
    { meta: [], files: [] }
  );

  return {
    operation: result.operation,
    payload: {
      args: toObject(args),
      ctx: toObject(ctx),
      attrs: toObject(attrs),
      ...Object.fromEntries(meta),
    },
    files: Object.fromEntries(files) as { [key: string]: SmartTokenFile },
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
  return payload.args?.i !== undefined ? payload.args.i === true : true;
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

function filterByKey(obj: object, allowedKeys: string[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => allowedKeys.includes(key))
  );
}

// Supported arg values
export function filterArgs(args: object) {
  return filterByKey(args, ["ticker"]);
}
