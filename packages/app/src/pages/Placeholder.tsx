import { Center } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import ContentContainer from "@app/components/ContentContainer";
import PageHeader from "../components/PageHeader";

export default function Placeholder() {
  return (
    <ContentContainer>
      <PageHeader showLogo display={{ base: "flex", lg: "none" }} />
      <Center fontSize="xl" fontWeight="bold" mt="20vh">
        {t`This feature is coming soon`}
      </Center>
    </ContentContainer>
  );
}
