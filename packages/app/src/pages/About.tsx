import { Container, Heading, Text } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import License from "@app/components/License";

export default function About() {
  return (
    <Container maxW="container.lg">
      <Text>Photonic Wallet</Text>
      <Text mb={4}>
        {t`Version:`} {APP_VERSION}
      </Text>
      <Heading mb={4} size="md">{t`License`}</Heading>
      <License />
    </Container>
  );
}
