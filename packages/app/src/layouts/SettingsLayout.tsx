import { Button, HStack } from "@chakra-ui/react";
import { Link, Outlet, useLocation } from "react-router-dom";
import ContentContainer from "@app/components/ContentContainer";
import PageHeader from "@app/components/PageHeader";
import { ChevronRightIcon } from "@chakra-ui/icons";

export default function SettingsLayout() {
  const { pathname } = useLocation();
  const headings: { [key: string]: string } = {
    "/settings/wallet": "Wallet",
    "/settings/servers": "Servers",
    "/settings/ipfs": "IPFS",
    "/settings/about": "About",
  };
  const heading = headings[pathname];

  return (
    <ContentContainer>
      <PageHeader>
        Settings <ChevronRightIcon mx={2} /> {heading}
      </PageHeader>
      <HStack mb={6} pl={4}>
        <Button as={Link} to="/settings/wallet">
          Wallet
        </Button>
        <Button as={Link} to="/settings/servers">
          Servers
        </Button>
        <Button as={Link} to="/settings/ipfs">
          IPFS
        </Button>
        <Button as={Link} to="/settings/about">
          About
        </Button>
      </HStack>
      <Outlet />
    </ContentContainer>
  );
}
