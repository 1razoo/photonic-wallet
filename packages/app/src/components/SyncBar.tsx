import db from "@app/db";
import { ContractType } from "@app/types";
import { Box, Flex, Icon, Progress, SimpleGrid } from "@chakra-ui/react";
import { useLiveQuery } from "dexie-react-hooks";
import { TbCircles, TbCoins, TbTriangleSquareCircle } from "react-icons/tb";

const contractIcon = {
  [ContractType.RXD]: TbCoins,
  [ContractType.NFT]: TbTriangleSquareCircle,
  [ContractType.FT]: TbCircles,
};

export default function SyncBar() {
  const subs = useLiveQuery(() =>
    db.subscriptionStatus.filter((v) => !v.sync.done).toArray()
  );

  if (!subs?.length) return null;

  const bars = subs.map(({ contractType, sync }) => (
    <Flex my={2} gap={2} alignItems="center">
      <Icon as={contractIcon[contractType]} boxSize={4} />
      {!sync.numTotal || sync.numSynced === undefined ? (
        <Progress flexGrow={1} isIndeterminate size="xs" />
      ) : (
        <Progress
          flexGrow={1}
          size="xs"
          hasStripe
          isAnimated
          value={(sync.numSynced / sync.numTotal) * 100}
        />
      )}
    </Flex>
  ));

  return (
    <SimpleGrid py={4} borderTopWidth={1} borderTopColor="whiteAlpha.100">
      <Box px={6} py={2} color="whiteAlpha.700">
        Syncing
        {bars}
      </Box>
    </SimpleGrid>
  );
}
