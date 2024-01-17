import { Flex, Text } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import ContentContainer from "@app/components/ContentContainer";
import PageHeader from "../components/PageHeader";

export default function Placeholder() {
  return (
    <ContentContainer>
      <PageHeader showLogo />
      <Flex flexDirection="column" alignItems="center" pt="33vh">
        <Text fontSize="2xl">{t`This feature is coming soon`}</Text>
      </Flex>
    </ContentContainer>
  );
}
