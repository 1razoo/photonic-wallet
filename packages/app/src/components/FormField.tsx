import { Box, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function FormField({
  heading,
  children,
}: PropsWithChildren<{
  heading: string;
}>) {
  return (
    <Box>
      <Text fontSize="md" fontWeight="semibold" pr={4}>
        {heading}
      </Text>
      {children && (
        <Text fontSize="sm" color="gray.400" pr={4}>
          {children}
        </Text>
      )}
    </Box>
  );
}
