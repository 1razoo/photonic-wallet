import browser from "webextension-polyfill";
import {
  Button,
  Container,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { t, Trans } from "@lingui/macro";
import PageHeader from "@app/components/PageHeader";
import Card from "@app/components/Card";
import ContentContainer from "@app/components/ContentContainer";
import { Navigate } from "react-router-dom";
import { network, openModal } from "@app/signals";
import Balance from "@app/components/Balance";
import ValueTag from "@app/components/ValueTag";
import { TbWindowMaximize } from "react-icons/tb";

export default function MobileHome() {
  const mobile = useBreakpointValue({ base: true, lg: false });

  // Home page isn't needed on desktop, side bar has everything
  if (!mobile) {
    return <Navigate to="/objects" />;
  }

  const isInBrowserExtensionPopup =
    // @ts-expect-error chrome
    ((typeof chrome !== "undefined" && chrome.runtime?.id) ||
      (typeof browser !== "undefined" && browser.runtime?.id)) &&
    !document.location.href.includes("?tab");

  return (
    <ContentContainer>
      <PageHeader
        showLogo
        toolbar={
          isInBrowserExtensionPopup && (
            <IconButton
              onClick={() => {
                browser.tabs.create({
                  url: "popup.html?tab",
                });
              }}
              variant="ghost"
              icon={
                <Icon
                  as={TbWindowMaximize}
                  boxSize={5}
                  transform="rotate(180deg)"
                />
              }
              aria-label="Open in tab"
            />
          )
        }
      />
      <Container maxW="container.md" px={4}>
        <Card mx="auto">
          <Flex flexDirection="column" alignItems="center" mb={4}>
            <Text fontSize="xl" fontWeight="medium" mb={2}>
              <Trans>{network.value.ticker} BALANCE</Trans>
            </Text>
            <ValueTag>
              <Balance />
            </ValueTag>
          </Flex>
          <SimpleGrid columns={[1, 2]} spacing={4} alignSelf="stretch">
            <Button
              onClick={() => {
                openModal.value = { modal: "send" };
              }}
            >
              {t`Send`}
            </Button>
            <Button
              onClick={() => {
                openModal.value = { modal: "receive" };
              }}
            >
              {t`Receive`}
            </Button>
          </SimpleGrid>
        </Card>
      </Container>
    </ContentContainer>
  );
}
