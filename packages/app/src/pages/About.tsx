import { Container, Heading } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import License from "@app/components/License";

export default function About() {
  return (
    <Container maxW="container.lg">
      <Heading mb={4}>{t`License`}</Heading>
      <License />
    </Container>
  );
}
