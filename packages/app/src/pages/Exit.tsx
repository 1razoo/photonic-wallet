import { Container } from "@chakra-ui/react";
import { t } from "@lingui/macro";

export default function Exit() {
  return (
    <Container maxW="container.lg" textAlign="center" pt={32}>
      {t`Please close the window`}
    </Container>
  );
}
