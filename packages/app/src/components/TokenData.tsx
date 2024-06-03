import { useEffect, useState } from "react";
import { Transaction } from "@radiantblockchain/radiantjs";
import opfs from "@app/opfs";
import Outpoint from "@lib/Outpoint";
import { Box, SimpleGrid } from "@chakra-ui/react";
import { DecodedRst, decodeRst } from "@lib/token";
import { jsonHex } from "@lib/util";
import DownloadLink from "./DownloadLink";
import { PropertyCard } from "./ViewDigitalObject";
import { t } from "@lingui/macro";
import { SmartToken } from "@app/types";
import { DownloadIcon } from "@chakra-ui/icons";
import ActionIcon from "./ActionIcon";

export default function TokenData({ rst }: { rst: SmartToken }) {
  const reveal = rst.revealOutpoint && Outpoint.fromString(rst.revealOutpoint);
  const [{ tx, decoded }, setData] = useState<{
    tx?: string;
    decoded?: DecodedRst;
  }>({
    tx: undefined,
    decoded: undefined,
  });

  useEffect(() => {
    (async () => {
      if (reveal) {
        const txid = reveal.getTxid();
        const tx = await opfs.getTx(txid);

        const script = tx
          ? new Transaction(tx).inputs[reveal.getVout()].script
          : undefined;
        const decoded = (script && decodeRst(script)) || undefined;

        setData({ tx, decoded });
      }
    })();
  }, []);

  return !reveal || !decoded || !tx ? (
    <Box mx={4}>{t`Data not found`}</Box>
  ) : (
    <>
      <PropertyCard heading="Token Data" mb={4}>
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
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2}>
        {tx && (
          <DownloadLink
            leftIcon={<ActionIcon as={DownloadIcon} />}
            data={new TextEncoder().encode(tx)}
            mimeType="application/octet-stream"
            filename={`${reveal.getTxid()}.txt`}
          >
            {t`Download transaction`}
          </DownloadLink>
        )}
        {rst.file && (
          <DownloadLink
            leftIcon={<ActionIcon as={DownloadIcon} />}
            mimeType="application/octet-stream"
            data={rst.file}
            filename={rst.filename || "file"}
          >
            {t`Download main file`}
          </DownloadLink>
        )}
      </SimpleGrid>
    </>
  );
}
