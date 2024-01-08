import { Box, Flex, Tag, SimpleGrid } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

function Word({ n, children }: PropsWithChildren<{ n: number }>) {
  return (
    <Flex bg="blackAlpha.400" p={2} borderRadius={8}>
      <Box mr={2} userSelect="none">
        <Tag width={8} justifyContent="center" bg="gray.700">
          {n + 1}
        </Tag>
      </Box>
      <Box flexGrow={1} textAlign="center">
        {children}
      </Box>
    </Flex>
  );
}

export default function RecoveryPhraseWords({ words }: { words: string[] }) {
  return (
    <SimpleGrid columns={[2, 2, 3]} spacing={2} mb={4}>
      {words.map((word, index) => (
        <Word n={index} key={index}>
          {word}
        </Word>
      ))}
    </SimpleGrid>
  );
}
