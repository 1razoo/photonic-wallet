import { PropsWithChildren } from "react";
import {
  CloseButton,
  Flex,
  Grid,
  GridProps,
  SimpleGrid,
} from "@chakra-ui/react";
import AccountBar from "./AccountBar";
import Logo from "./Logo";
import StatusBar from "./StatusBar";
import { language, openMenu } from "@app/signals";

export default function SideBar({
  children,
  ...rest
}: PropsWithChildren & GridProps) {
  // Trigger rerender when language changes
  language.value;

  return (
    <Grid
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      height="100vh"
      width={{ base: "100%", lg: "232px", "2xl": "284px" }}
      bgColor="bg.300"
      gridTemplateRows={{
        base: "72px auto 1fr",
        lg: "auto auto auto 1fr",
      }}
      zIndex={20}
      {...rest}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        px={6}
        display={{ base: "flex", lg: "none" }}
      >
        <Logo my={6} svgId="m" />
        <CloseButton
          size="lg"
          onClick={() => {
            openMenu.value = false;
          }}
          aria-label="Close menu"
        />
      </Flex>
      <Logo my={6} display={{ base: "none", lg: "flex" }} svgId="d" />
      <AccountBar display={{ base: "none", lg: "flex" }} />
      <SimpleGrid
        overflow="auto"
        borderTopWidth={1}
        borderTopColor="whiteAlpha.100"
        mt={{ base: 0, lg: 6 }}
        pt={6}
      >
        {children}
      </SimpleGrid>
      <SimpleGrid
        py={4}
        alignSelf="end"
        borderTopWidth={1}
        borderTopColor="whiteAlpha.100"
      >
        <StatusBar />
      </SimpleGrid>
    </Grid>
  );
}
