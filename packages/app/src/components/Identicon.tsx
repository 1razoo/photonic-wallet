import { Box, BoxProps } from "@chakra-ui/react";
import { toSvg } from "jdenticon";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

export default function Identicon({
  value,
  ...rest
}: { value: string } & BoxProps) {
  // Hash the ref to create more colour variation
  const svg = toSvg(bytesToHex(sha256(value)), 100);
  return (
    <Box
      display="flex"
      sx={{ "& svg": { width: "100%", height: "100%" } }}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...rest}
    />
  );
}
