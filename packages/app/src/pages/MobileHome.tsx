import {
  Button,
  Container,
  Flex,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { t, Trans } from "@lingui/macro";
import { photonsToRXD } from "@lib/format";
import PageHeader from "@app/components/PageHeader";
import Card from "@app/components/Card";
import ContentContainer from "@app/components/ContentContainer";
import { Navigate } from "react-router-dom";
import { balance, network, openModal, totalBalance } from "@app/signals";

export default function MobileHome() {
  const mobile = useBreakpointValue({ base: true, lg: false });

  // Home page isn't needed on desktop, side bar has everything
  if (!mobile) {
    return <Navigate to="/objects" />;
  }

  return (
    <ContentContainer>
      <PageHeader showLogo />
      <Container maxW="container.md" px={4}>
        <Card mx="auto">
          <Flex flexDirection="column" alignItems="center">
            <Text fontSize="xl" fontWeight="medium" mb={2}>
              <Trans>{network.value.ticker} BALANCE</Trans>
            </Text>
            <Tag
              size="lg"
              variant="subtle"
              colorScheme="lightBlue"
              mb={6}
              minHeight="auto"
              lineHeight="24px"
              py={1}
              textAlign="center"
            >
              {balance.value.ready ? (
                <>
                  {photonsToRXD(totalBalance.value)} {network.value.ticker}
                </>
              ) : (
                <Spinner size="sm" />
              )}
            </Tag>
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
