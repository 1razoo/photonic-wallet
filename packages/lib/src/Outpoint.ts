import { Buffer } from "buffer";
import { base32crockford } from "@scure/base";
import { sha256 } from "@noble/hashes/sha256";

export default class Outpoint {
  txid: Buffer;
  vout: Buffer;

  constructor(txid: Buffer, vout: Buffer) {
    this.txid = txid;
    this.vout = vout;
  }

  static fromString(str: string) {
    const txid = str.substring(0, 64);
    const vout = str.substring(64);

    return new Outpoint(Buffer.from(txid, "hex"), Buffer.from(vout, "hex"));
  }

  static fromUTXO(txid: string, vout: number) {
    const voutBuf = Buffer.alloc(4);
    voutBuf.writeUInt32BE(vout);
    return new Outpoint(Buffer.from(txid, "hex"), voutBuf);
  }

  static fromObject({ txid, vout }: { txid: string; vout: number }) {
    return Outpoint.fromUTXO(txid, vout);
  }

  reverse() {
    return new Outpoint(
      Buffer.from(this.txid).reverse(),
      Buffer.from(this.vout).reverse()
    );
  }

  ref(type?: string) {
    const vout = type
      ? `${type}${this.vout.readUInt32BE()}`
      : `${this.vout.toString("hex").padStart(8, "0")}`;
    return `${this.txid.toString("hex")}${vout}`;
  }

  toString() {
    return this.ref();
  }

  short(type: string) {
    const str = this.txid.toString("hex");

    return `${str.substring(0, 4)}…${str.substring(
      60,
      64
    )}${type}${this.vout.readUInt32BE()}`;
  }

  shortRef() {
    return this.short("s");
  }

  shortInput() {
    return this.short("i");
  }

  shortOutput() {
    return this.short("o");
  }

  atom() {
    return `${base32crockford
      .encode(this.txid)
      .toLowerCase()}i${this.vout.readUInt32BE()}`;
  }

  shortAtom() {
    return `${base32crockford
      .encode(this.txid)
      .substring(0, 8)
      .toLowerCase()}i${this.vout.readUInt32BE()}`;
  }

  refHash() {
    return Buffer.from(sha256(Buffer.from(this.ref(), "hex"))).toString("hex");
  }

  getTxid() {
    return this.txid.toString("hex");
  }

  getVout() {
    return this.vout.readUInt32BE();
  }

  toObject() {
    return {
      txid: this.getTxid(),
      vout: this.getVout(),
    };
  }
}
