import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import { TxO } from "@app/types";

export default function useTxoQuery(
  criteria: (txo: TxO) => boolean,
  pageSize: number,
  page: number
) {
  return useLiveQuery(
    async () => {
      return await db.txo
        .reverse()
        .offset(page * pageSize)
        .filter(criteria)
        // Use page size + 1 so we know if there's a next page
        .limit(pageSize + 1)
        .toArray();
    },
    [page],
    []
  );
}
