import { useEffect, useState } from "react";
import { Transaction } from "@radiantblockchain/radiantjs";
import opfs from "@app/opfs";
import Outpoint from "@lib/Outpoint";
import { Box, SimpleGrid } from "@chakra-ui/react";
import { DecodedAtom, decodeAtom } from "@lib/atom";
import { jsonHex } from "@lib/util";
import DownloadLink from "./DownloadLink";
import { PropertyCard } from "./ViewDigitalObject";
import AtomIcon from "./AtomIcon";
import { t } from "@lingui/macro";
import { Atom } from "@app/types";
import { DownloadIcon } from "@chakra-ui/icons";
import ActionIcon from "./ActionIcon";

export default function AtomData({ atom }: { atom: Atom }) {
  const reveal =
    atom.revealOutpoint && Outpoint.fromString(atom.revealOutpoint);
  const [{ tx, decoded }, setData] = useState<{
    tx?: string;
    decoded?: DecodedAtom;
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
        const decoded = (script && decodeAtom(script)) || undefined;

        setData({ tx, decoded });
      }
    })();
  }, []);

  return !reveal || !decoded || !tx ? (
    <Box mx={4}>{t`Data not found`}</Box>
  ) : (
    <>
      <PropertyCard
        heading={
          <>
            <AtomIcon
              mr={2}
              color="white"
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
        {atom.file && (
          <DownloadLink
            leftIcon={<ActionIcon as={DownloadIcon} />}
            mimeType="application/octet-stream"
            data={atom.file}
            filename={atom.filename || "file"}
          >
            {t`Download main file`}
          </DownloadLink>
        )}
      </SimpleGrid>
    </>
  );
}
