import { NavLink, useNavigate } from "react-router-dom";
import { ArrowBackIcon, CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import { Flex, FlexProps, Heading, IconButton, Spacer } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { openMenu } from "@app/signals";
import Logo from "./Logo";

export default function PageHeader({
  back = false,
  close = false,
  showLogo = false,
  to,
  toolbar,
  children,
  ...rest
}: PropsWithChildren<{
  back?: boolean;
  close?: boolean;
  showLogo?: boolean;
  to?: string;
  toolbar?: React.ReactNode;
}> &
  FlexProps) {
  const navigate = useNavigate();
  return (
    <Flex
      px={6}
      alignItems="center"
      justifyContent="space-between"
      height="72px"
      position="sticky"
      top="0"
      bgColor="bg.100"
      mb={4}
      zIndex={10}
      {...rest}
    >
      {(back || close) && (
        <IconButton
          isRound
          aria-label="Back"
          variant="ghost"
          icon={back ? <ArrowBackIcon /> : <CloseIcon />}
          ml={-2}
          mr={1}
          {...(to
            ? {
                as: NavLink,
                to,
              }
            : {
                onClick: () => navigate(-1),
              })}
        />
      )}
      {showLogo ? (
        <Logo display={{ base: "flex", lg: "none" }} svgId="h" />
      ) : (
        <Heading
          size="md"
          fontWeight="medium"
          display="flex"
          alignItems="center"
        >
          {children}
        </Heading>
      )}
      <Spacer />
      {toolbar}
      <IconButton
        icon={<HamburgerIcon />}
        display={{ base: "flex", lg: "none" }}
        aria-label="Open menu"
        ml={4}
        onClick={() => {
          openMenu.value = true;
        }}
      />
    </Flex>
  );
}
