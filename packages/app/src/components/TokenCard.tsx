import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import Outpoint from "@lib/Outpoint";
import { Atom } from "@app/types";
import { Link } from "react-router-dom";
import Identifier from "@app/components/Identifier";
import Photons from "@app/components/Photons";
import TokenContent from "@app/components/TokenContent";
import { TbBox, TbUserCircle } from "react-icons/tb";
import { IconType } from "react-icons/lib";

export default function TokenCard({
  atom,
  value,
  to,
  size = "md",
  defaultIcon,
}: {
  atom?: Atom;
  value: number;
  to: string;
  size?: "sm" | "md";
  defaultIcon?: IconType;
}) {
  const ref = Outpoint.fromString(atom?.ref || "");

  const shortAtom = ref.shortInput();
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
        <TokenContent atom={atom} defaultIcon={defaultIcon} thumbnail />
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
          <Photons value={value} />
        </Text>
      </Flex>
    </Box>
  );
}
