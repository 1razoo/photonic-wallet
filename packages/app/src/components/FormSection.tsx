import { Flex, FlexProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function FormSection({
  children,
  ...rest
}: PropsWithChildren & FlexProps) {
  return (
    <Flex
      bgColor="bg.100"
      p={{ base: 4, md: 6 }}
      flexDirection="column"
      gap={6}
      {...rest}
    >
      {children}
    </Flex>
  );
}
