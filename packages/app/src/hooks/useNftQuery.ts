import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import { SmartToken, SmartTokenType, TxO } from "@app/types";

export default function useNftQuery(
  criteria: (glyph: SmartToken) => boolean,
  pageSize: number,
  page: number,
  deps?: unknown[]
) {
  return useLiveQuery(
    async () => {
      const results = await db.glyph
        .orderBy("height")
        .filter(criteria)
        .filter(
          (glyph) => glyph.tokenType === SmartTokenType.NFT && !!glyph.lastTxoId
        ) // This will be undefined for related tokens not owned by the user
        .reverse()
        .offset(page * pageSize)
        // Use page size + 1 so we know if there's a next page
        .limit(pageSize + 1)
        .toArray();
      // There might be a better way to do this
      return Promise.all(
        results.map(async (a) => ({
          txo: (await db.txo.get({ id: a.lastTxoId })) as TxO,
          glyph: a,
        }))
      );
    },
    [page, ...(deps || [])],
    []
  );
}
