import { fundTx, SelectableInput } from "@lib/coinSelect";
import { ContractType, SwapError } from "./types";
import db from "./db";
import { ftScript, nftScript, p2pkhScript } from "@lib/script";
import { reverseRef } from "@lib/Outpoint";
import { buildTx } from "@lib/tx";
import { UnfinalizedInput } from "@lib/types";
import { electrumWorker } from "./electrum/Electrum";
import { wallet, feeRate } from "./signals";

export const cancelSwap = async (
  contractType: ContractType,
  txid: string,
  value: number,
  glyphRef?: string
) => {
  const coins: SelectableInput[] = await db.txo
    .where({ contractType: ContractType.RXD, spent: 0 })
    .toArray();

  // Move reserved RXD and tokens back to spendable address
  if (contractType === ContractType.RXD) {
    const fromScript = p2pkhScript(wallet.value.swapAddress);
    const changeScript = p2pkhScript(wallet.value.address);
    const inputs: UnfinalizedInput[] = [
      { txid, vout: 0, value, script: fromScript },
    ];
    const fund = fundTx(
      wallet.value.address,
      coins,
      inputs,
      [],
      changeScript,
      feeRate.value
    );
    if (!fund.funded) {
      throw new SwapError("Failed to fund");
    }
    inputs.push(...fund.funding);
    const outputs = fund.change;

    const privKey = wallet.value.wif as string;
    const swapPrivKey = wallet.value.swapWif as string;
    const rawTx = buildTx(
      wallet.value.address,
      [swapPrivKey, ...fund.funding.map(() => privKey)],
      inputs,
      outputs,
      false
    ).toString();
    const cancelTxid = await electrumWorker.value.broadcast(rawTx);
    db.broadcast.put({
      txid: cancelTxid,
      date: Date.now(),
      description: "rxd_swap_cancel",
    });
  } else {
    const ftSwap = contractType === ContractType.FT;
    const refLE = reverseRef(glyphRef as string);
    const fromScript = ftSwap
      ? ftScript(wallet.value.swapAddress, refLE)
      : nftScript(wallet.value.swapAddress, refLE);
    const toScript = ftSwap
      ? ftScript(wallet.value.address, refLE)
      : nftScript(wallet.value.address, refLE);
    const changeScript = p2pkhScript(wallet.value.address);
    const inputs: SelectableInput[] = [
      {
        txid,
        vout: 0,
        value,
        script: fromScript,
        required: true,
      },
    ];
    const outputs = [{ script: toScript, value }];
    const fund = fundTx(
      wallet.value.address,
      coins,
      inputs,
      outputs,
      changeScript,
      feeRate.value
    );
    if (!fund.funded) {
      throw new SwapError("Failed to fund");
    }
    inputs.push(...fund.funding);
    outputs.push(...fund.change);

    const privKey = wallet.value.wif as string;
    const swapPrivKey = wallet.value.swapWif as string;
    const rawTx = buildTx(
      wallet.value.address,
      [swapPrivKey, ...fund.funding.map(() => privKey)],
      inputs,
      outputs,
      false
    ).toString();
    const cancelTxid = await electrumWorker.value.broadcast(rawTx);
    db.broadcast.put({
      txid: cancelTxid,
      date: Date.now(),
      description: ftSwap ? "ft_swap_cancel" : "nft_swap_cancel",
    });
    await db.glyph.where({ ref: glyphRef }).modify({
      swapPending: false,
    });
  }

  ////// db.swap.update(swap.id as number, { status: SwapStatus.CANCEL });
  ////// toast
};
