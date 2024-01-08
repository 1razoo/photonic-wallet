import { Box, ContainerProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function ContentContainer({
  children,
  ...rest
}: PropsWithChildren & ContainerProps) {
  return (
    <Box pl={{ base: 0, lg: "232px", "2xl": "284px" }} {...rest}>
      {children}
    </Box>
  );
}
