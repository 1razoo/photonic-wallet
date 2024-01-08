import { Flex, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function NoContent({ children }: PropsWithChildren) {
  return (
    <Flex flexDirection="column" alignItems="center" pt="33vh">
      <Text fontSize="2xl">{children}</Text>
    </Flex>
  );
}
