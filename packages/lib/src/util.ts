import { bytesToHex } from "@noble/hashes/utils";

export const jsonHex = (obj: unknown, byteLimit = 0) => {
  const tooLarge = "<data too large>";
  return JSON.stringify(
    obj,
    (_, value) => {
      if (value instanceof Uint8Array) {
        if (byteLimit && value.length > byteLimit) return tooLarge;
        return bytesToHex(value);
      }
      // JSON.stringify converts Buffer to { type: "Buffer", data: [] } so convert back to Buffer then to hex
      if (value?.type === "Buffer") {
        const buf = Buffer.from(value);
        if (byteLimit && buf.length > byteLimit) return tooLarge;
        return bytesToHex(buf);
      }
      if (typeof value === "string") {
        if (byteLimit && value.length / 2 > byteLimit) return tooLarge;
      }

      return value;
    },
    2
  );
};
