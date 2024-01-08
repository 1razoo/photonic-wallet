import { Flex, FlexProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function GlowBox({
  active = true,
  children,
  borderRadius,
  ...rest
}: PropsWithChildren<{ active?: boolean } & Partial<FlexProps>>) {
  return (
    <Flex
      flexDir="column"
      justifyContent="center"
      alignItems="center"
      transition="all 0.2s ease-out"
      position="relative"
      bg="gray.900"
      sx={{
        "&:after, &:before": {
          content: `""`,
          position: "absolute",
          background:
            "conic-gradient(from var(--angle), var(--chakra-colors-deepPurple-A700), var(--chakra-colors-lightBlue-800), var(--chakra-colors-deepPurple-A700))",
          animation: "glow-border 4s linear infinite",
          animationDuration: active ? "1s" : "4s",
          inset: "-2px",
          zIndex: "-1",
          filter: `grayscale(${active ? 0 : 1})`,
          transition: "0.15s linear",
          opacity: 0.8,
          borderRadius,
        },
        "&:after": {
          filter: `blur(15px) grayscale(${active ? 0 : 1})`,
          opacity: 0.5,
        },
      }}
      borderRadius={borderRadius}
      {...rest}
    >
      {children}
    </Flex>
  );
}
