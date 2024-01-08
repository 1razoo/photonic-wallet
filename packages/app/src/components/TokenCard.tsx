import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import Outpoint from "@lib/Outpoint";
import { AtomNft, TxO } from "@app/types";
import { Link } from "react-router-dom";
import Identifier from "@app/components/Identifier";
import Photons from "@app/components/Photons";
import TokenContent from "@app/components/TokenContent";
import { TbBox, TbUserCircle } from "react-icons/tb";

export default function TokenCard({
  token: { txo, atom },
  to,
  size = "md",
}: {
  token: { txo: TxO; atom?: AtomNft };
  to: string;
  size?: "sm" | "md";
}) {
  const ref = Outpoint.fromString(txo.script.substring(2, 74)).reverse();

  const shortAtom = ref.shortAtom();
  return (
    <Box borderRadius="md" overflow="hidden" as={Link} to={to}>
      <Box
        bgGradient="linear(to-b, bg.100, bg.300)"
        height={size === "sm" ? "175px" : "250px"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={2}
      >
        <TokenContent nft={atom} thumbnail />
      </Box>
      <Flex
        p={2}
        pr={3}
        bg="bg.100"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        lineHeight={8}
      >
        <Flex alignItems="center">
          {atom?.type === "user" && <Icon as={TbUserCircle} fontSize="2xl" />}
          {atom?.type === "container" && <Icon as={TbBox} fontSize="2xl" />}
          {atom?.name ? (
            <Text
              fontWeight="500"
              color="lightBlue.A400"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              ml={1}
            >
              {atom?.name}
            </Text>
          ) : (
            <Identifier>{shortAtom}</Identifier>
          )}
        </Flex>
        <Text whiteSpace="nowrap" fontFamily="mono">
          <Photons value={txo.value} />
        </Text>
      </Flex>
    </Box>
  );
}
