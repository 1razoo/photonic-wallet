import { Address, Opcode, Script } from "@radiantblockchain/radiantjs";
import { sha256 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";
import { atomBuffer } from "./atom";

const zeroRef = "00".repeat(36);

export function scriptHash(hex: string): string {
  return Buffer.from(sha256(Buffer.from(hex, "hex")))
    .reverse()
    .toString("hex");
}

export function p2pkhScript(address: string): string {
  try {
    return Script.buildPublicKeyHashOut(address).toHex();
  } catch {
    return "";
  }
}

export function p2pkhScriptHash(address: string): string {
  return scriptHash(p2pkhScript(address));
}

export function nftCommitScript(
  address: string,
  payloadHash: Buffer,
  authorRef?: string,
  containerRef?: string
) {
  const script = new Script();

  // REQUIREINPUTREFs at the start of the script are used to prove the minter has permission to create a relationship with these tokens
  if (authorRef) {
    script.add(Script.fromString(`OP_REQUIREINPUTREF 0x${authorRef} OP_DROP`));
  }

  if (containerRef) {
    script.add(
      Script.fromString(`OP_REQUIREINPUTREF 0x${containerRef} OP_DROP`)
    );
  }

  // Check payload hash
  script.add(Opcode.OP_HASH256).add(payloadHash).add(Opcode.OP_EQUALVERIFY);
  // atom nft
  script
    .add(Buffer.from("nft"))
    .add(Opcode.OP_EQUALVERIFY)
    .add(atomBuffer)
    .add(Opcode.OP_EQUALVERIFY);
  // Ensure singleton for this input exists in an output
  script.add(
    Script.fromString(
      "OP_INPUTINDEX OP_OUTPOINTTXHASH OP_INPUTINDEX OP_OUTPOINTINDEX OP_4 OP_NUM2BIN OP_CAT OP_REFTYPE_OUTPUT OP_2 OP_NUMEQUALVERIFY"
    )
  );

  // P2PKH
  // FIXME would be better to have this first so "atom nft" is at the start of the script sig
  script.add(Script.buildPublicKeyHashOut(Address.fromString(address)));

  return script.toHex();
}

export function nftScript(address: string, ref: string) {
  const script = new Script(`OP_PUSHINPUTREFSINGLETON 0x${ref} OP_DROP`).add(
    Script.buildPublicKeyHashOut(address)
  );
  return script.toHex();
}

export function mutableNftScript(
  mutableRef: string,
  nftRef: string,
  payloadHash: Buffer
) {
  // @ts-ignore
  return Script.fromASM(
    [
      `${payloadHash.toString("hex")} OP_DROP`, // State
      // Pay to token script
      `OP_STATESEPARATOR OP_PUSHINPUTREFSINGLETON ${mutableRef}`, // Contract ref
      `OP_OVER OP_REFDATASUMMARY_OUTPUT OP_3 OP_ROLL 24 OP_MUL OP_SPLIT OP_NIP 24 OP_SPLIT OP_DROP ${nftRef} OP_EQUALVERIFY`, // Check token ref exists in the token output
      `OP_SWAP OP_STATESCRIPTBYTECODE_OUTPUT OP_ROT OP_SPLIT OP_NIP 45 OP_SPLIT OP_DROP OP_OVER 20 OP_CAT OP_INPUTINDEX OP_INPUTBYTECODE OP_HASH256 OP_CAT OP_EQUALVERIFY`, // Compare ref + hash in token output to ref + hash of this script's unlocking code
      `OP_3 OP_PICK 6d6f64 OP_EQUAL OP_IF`, // Modify operation
      `OP_OVER OP_CODESCRIPTBYTECODE_OUTPUT OP_INPUTINDEX OP_CODESCRIPTBYTECODE_UTXO OP_EQUALVERIFY`, // Contract script must exist unchanged in output
      `OP_OVER OP_STATESCRIPTBYTECODE_OUTPUT 20 OP_4 OP_PICK OP_HASH256 OP_CAT 75 OP_CAT OP_EQUALVERIFY`, // State script must contain payload hash
      `OP_ELSE OP_3 OP_PICK 736c OP_EQUALVERIFY OP_OVER OP_OUTPUTBYTECODE d8 OP_2 OP_PICK OP_CAT 6a OP_CAT OP_EQUAL OP_OVER OP_REFTYPE_OUTPUT OP_0 OP_NUMEQUAL OP_BOOLOR OP_VERIFY OP_ENDIF`, // Seal operation
      `OP_4 OP_ROLL 61746f6d OP_EQUALVERIFY OP_2DROP OP_2DROP OP_1`, // Atom header
    ].join(" ")
  ).toHex() as string;
}

export function nftScriptHash(address: string) {
  return scriptHash(nftScript(address, zeroRef));
}

export function parseCommitScript(script: string): string[] {
  const pattern =
    /^((d1[0-9a-f]{72}75)+)aa20[0-9a-f]{64}88036e667488047370723588c0c8c0c954807eda529d.*/; // Don't need to match p2pkh
  const match = script.match(pattern);

  if (match) {
    // Return required refs
    const refs = match[1].match(/.{76}/g);
    if (refs) {
      return refs.map((ref) => ref.substring(2, 74));
    }
  }

  return [];
}

type MutableScriptParams = {
  hash: string;
  mutableRef: string;
  tokenRef: string;
};

export function parseMutableScript(
  script: string
): MutableScriptParams | undefined {
  const pattern =
    /^20(?<hash>[0-9a-f]{64})75bdd8(?<mutableRef>[0-9a-f]{72})78e2537a0124957f7701247f7524(?<tokenRef>[0-9a-f]{72})887cec7b7f7701457f757801207ec0caaa7e885379036d6f64876378eac0e98878ec01205479aa7e01757e8867537902736c8878cd01d852797e016a7e8778da009c9b6968547a0461746f6d886d6d51$/;
  const match = script.match(pattern);

  if (match) {
    return match.groups as MutableScriptParams;
  }

  return undefined;
}
