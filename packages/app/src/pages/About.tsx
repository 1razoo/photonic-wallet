import { Container, Heading } from "@chakra-ui/react";
import License from "@app/components/License";

export default function About() {
  return (
    <Container maxW="container.lg">
      <Heading mb={4}>License</Heading>
      <License />
    </Container>
  );
}
