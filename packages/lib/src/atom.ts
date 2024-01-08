/* eslint-disable @typescript-eslint/ban-ts-comment */
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { decode, encode } from "cbor-x";
// @ts-ignore
import { Script } from "@radiantblockchain/radiantjs";
import { AtomPayload } from "@app/types";

//const atomHex = "73707235";
const atomHex = "73737373";
export const atomBuffer = Buffer.from(atomHex, "hex");

const toObject = (obj: unknown) =>
  typeof obj === "object" ? (obj as { [key: string]: unknown }) : {};

const toArray = (arr: unknown) => (Array.isArray(arr) ? arr : []);

export function decodeAtom(script: Script):
  | undefined
  | {
      operation?: string;
      payload: AtomPayload;
      files: { [key: string]: unknown };
    } {
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
      Buffer.from(buf).toString("hex") !== atomHex ||
      script.chunks.length <= index + 2
    ) {
      return false;
    }

    const operation = script.chunks[index + 1];
    const payload = script.chunks[index + 2];
    if (operation.opcodenum !== 3 || !operation.buf || !payload.buf) {
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

  if (!result.operation) return undefined;

  const {
    meta,
    args,
    ctx,
    by,
    in: container,
    ...rest
  } = result.payload as { [key: string]: unknown };

  return {
    operation: result.operation,
    payload: {
      meta: toObject(meta),
      args: toObject(args),
      ctx: toObject(ctx),
      in: toArray(container),
      by: toArray(by),
    },
    files: rest,
  };
}

export function encodeAtom(
  operation: string,
  payload: unknown
): { atomScript: Script; atomPayloadHash: Buffer } {
  const encodedPayload = Buffer.from(encode(payload));
  return {
    atomScript: new Script()
      .add(atomBuffer)
      .add(Buffer.from(operation))
      .add(encodedPayload),
    atomPayloadHash: Buffer.from(sha256(sha256(Buffer.from(encodedPayload)))),
  };
}
