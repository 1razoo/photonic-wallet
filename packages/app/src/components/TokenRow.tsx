import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import Outpoint from "@lib/Outpoint";
import { Atom } from "@app/types";
import { Link } from "react-router-dom";
import Identifier from "@app/components/Identifier";
import TokenContent from "@app/components/TokenContent";
import { TbBox, TbUserCircle } from "react-icons/tb";
import { IconType } from "react-icons/lib";
import ValueTag from "./ValueTag";

const Ref = ({ value }: { value: string }) => {
  const ref = Outpoint.fromString(value);
  return (
    <Identifier showCopy copyValue={ref.ref()}>
      {ref.shortInput()}
    </Identifier>
  );
};

export default function TokenRow({
  atom,
  value,
  to,
  defaultIcon,
}: {
  atom: Atom;
  value: number;
  to: string;
  size?: "sm" | "md";
  defaultIcon?: IconType;
}) {
  const ref = Outpoint.fromString(atom?.ref || "");

  const shortAtom = ref.shortInput();
  return (
    <Flex
      bgGradient="linear(to-b, bg.100, bg.300)"
      alignItems="center"
      p={2}
      pr={4}
      mb={4}
      gap={2}
      borderRadius="md"
      overflow="hidden"
      as={Link}
      to={to}
      w="100%"
      maxW={{ lg: "container.md" }}
      mx="auto"
    >
      <Box w="48px" h="48px" /*sx={{ "& > *": { w: "64px", h: "64px" } }}*/>
        <TokenContent atom={atom} defaultIcon={defaultIcon} thumbnail />
      </Box>
      <Box flexGrow={1}>
        <Flex gap={2}>
          {atom.type === "user" && <Icon as={TbUserCircle} fontSize="2xl" />}
          {atom.type === "container" && <Icon as={TbBox} fontSize="2xl" />}
          {atom.name ? (
            <Text
              as="div"
              fontWeight="500"
              color="lightBlue.A400"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              ml={1}
            >
              {atom.name}
            </Text>
          ) : (
            <Identifier>{shortAtom}</Identifier>
          )}
          <Text as="div" color="gray.400">
            {(atom.args.ticker as string) || ""}
          </Text>
        </Flex>
        <Ref value={atom.ref} />
      </Box>
      <ValueTag>{value}</ValueTag>
    </Flex>
  );
}
