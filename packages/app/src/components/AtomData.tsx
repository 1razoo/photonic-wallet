import { Transaction } from "@radiantblockchain/radiantjs";
import db from "@app/db";
import opfs from "@app/opfs";
import Outpoint from "@lib/Outpoint";
import { useLiveQuery } from "dexie-react-hooks";
import { Box } from "@chakra-ui/react";
import { decodeAtom } from "@lib/atom";
import { jsonHex } from "@lib/util";
import DownloadLink from "./DownloadLink";
import { PropertyCard } from "./ViewAsset";
import AtomIcon from "./AtomIcon";
import { t } from "@lingui/macro";

export default function AtomData({ sref }: { sref: string }) {
  const [atom, op, tx] = useLiveQuery(
    async () => {
      const atom = await db.atomNft.get({ ref: sref });
      if (!atom || !atom.revealOutpoint) return [undefined, undefined];
      const op = Outpoint.fromString(atom.revealOutpoint);
      return [atom, op, op && (await opfs.getTx(op.getTxid()))];
    },
    [sref],
    [null, null, null]
  );

  if (atom === null) {
    return null;
  }

  const script = tx
    ? new Transaction(tx).inputs[op.getVout()].script
    : undefined;
  const decoded = (script && decodeAtom(script)) || {
    files: undefined,
    operation: undefined,
    payload: undefined,
  };

  return atom === undefined || (atom && !tx) ? (
    <Box mx={4}>{t`Data not found`}</Box>
  ) : (
    <>
      <PropertyCard
        heading={
          <>
            <AtomIcon
              fill="#fff"
              mr={2}
              bgColor="blackAlpha.400"
              p={1}
              fontSize="2xl"
              borderRadius={2}
            />
            <span>Atomical Payload</span>
          </>
        }
        mb={4}
      >
        <Box
          as="pre"
          gridArea="child"
          p={4}
          whiteSpace="pre-wrap"
          wordBreak="break-all"
          bg="blackAlpha.300"
        >
          {jsonHex({ ...decoded.payload, ...decoded.files }, 36)}
        </Box>
      </PropertyCard>
      {tx && (
        <DownloadLink
          data={new TextEncoder().encode(tx)}
          mimeType="application/octet-stream"
          filename={`${op.getTxid()}.txt`}
        >
          {t`Download Transaction`}
        </DownloadLink>
      )}
    </>
  );
}
