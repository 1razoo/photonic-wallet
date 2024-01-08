import { Flex } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function FormSection({ children }: PropsWithChildren) {
  return (
    <Flex
      bgColor="bg.100"
      p={{ base: 4, md: 6 }}
      flexDirection="column"
      gap={6}
    >
      {children}
    </Flex>
  );
}
