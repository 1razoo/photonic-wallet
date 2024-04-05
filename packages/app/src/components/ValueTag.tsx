import { Tag, TagProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function ValueTag({
  children,
  ...props
}: PropsWithChildren & TagProps) {
  return (
    <Tag
      size="lg"
      variant="subtle"
      colorScheme="lightBlue"
      minHeight="auto"
      lineHeight="24px"
      py={1}
      textAlign="center"
      {...props}
    >
      {children}
    </Tag>
  );
}
