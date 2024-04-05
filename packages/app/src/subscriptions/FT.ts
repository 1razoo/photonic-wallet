import { Atom, ContractType, ElectrumCallback, TxO } from "@app/types";
import { NFTSubscription } from "./NFT";
import { buildUpdateTXOs } from "./buildUpdateTXOs";
import ElectrumManager from "@app/electrum/ElectrumManager";
import { CreateToastFnReturn } from "@chakra-ui/react";
import { ftScriptHash, parseFtScript } from "@lib/script";
import db from "@app/db";
import Outpoint, { reverseRef } from "@lib/Outpoint";
import { t } from "@lingui/macro";
import { updateTokenBalances } from "@app/updateTokenBalances";

export class FTSubscription extends NFTSubscription {
  constructor(electrum: ElectrumManager) {
    super(electrum);
    this.updateTXOs = buildUpdateTXOs(this.electrum, ContractType.FT);
  }

  async register(address: string, toast: CreateToastFnReturn) {
    const scriptHash = ftScriptHash(address as string);

    // create status record if it doesn't exist
    if (!(await db.subscriptionStatus.get(scriptHash))) {
      db.subscriptionStatus.put({ scriptHash, status: "" });
    }

    this.electrum.client?.subscribe(
      "blockchain.scripthash",
      (async (scriptHash: string, newStatus: string) => {
        const { added, newTxs, spent } = await this.updateTXOs(
          scriptHash,
          newStatus
        );

        // Only one instance of each ref is needed for FTs. Dedup multiple UTXOs for an FT.
        const refs = new Map<string, { ref: string; txo: TxO }>();
        const scriptRefMap: { [key: string]: string } = {};
        added.forEach((txo) => {
          const { ref } = parseFtScript(txo.script);
          if (ref && !refs.has(ref)) {
            scriptRefMap[txo.script] = reverseRef(ref);
            refs.set(ref, {
              ref: Outpoint.fromString(ref).reverse().ref(),
              txo,
            });
          }
        });

        const { received, related } = await this.addTokens(
          Array.from(refs.values()),
          newTxs || {}
        );
        this.addRelated(related);

        const atomMap = received.reduce<{ [key: string]: Atom }>(
          (prev, cur) => {
            return { ...prev, [cur.atom.ref]: cur.atom };
          },
          {}
        );

        // When displaying the received toast we don't want to include received change
        const scriptSum = (txos: { value: number; script: string }[]) =>
          txos.reduce<{ [key: string]: number }>((prev, cur) => {
            prev[cur.script] = (prev[cur.script] || 0) + cur.value;
            return prev;
          }, {});

        const addedSum = scriptSum(added);
        const spentSum = scriptSum(spent);
        const deltas = Object.entries(addedSum)
          .map(([script, value]) => [
            script,
            (value - (spentSum[script] || 0)) as number,
          ])
          .filter(([, value]) => (value as number) > 0);

        const limited = deltas.length > 11 ? deltas.slice(0, 10) : deltas;
        limited.forEach(([script, value]) => {
          const atom = atomMap[scriptRefMap[script]];
          toast({
            title: t`Received ${value} ${
              atom.name ||
              atom.args.ticker ||
              Outpoint.fromString(atom.ref).shortInput()
            }`,
          });
        });

        if (deltas.length > 11) {
          toast({
            title: t`Received ${deltas.length - 10} more tokens`,
          });
        }

        // Calculate token balances
        updateTokenBalances();
      }) as ElectrumCallback,
      scriptHash
    );
  }
}
