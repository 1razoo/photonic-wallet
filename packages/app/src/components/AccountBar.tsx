import {
  Button,
  Flex,
  FlexProps,
  SimpleGrid,
  Spinner,
  Tag,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { photonsToRXD } from "@lib/format";
import { balance, network, openModal, totalBalance } from "@app/signals";

export default function AccountBar(props: FlexProps) {
  return (
    <>
      <Flex flexDir="column" alignItems="center" mx={4} {...props}>
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

        <SimpleGrid columns={[1, 2]} spacing={4} alignSelf="stretch">
          <Button onClick={() => (openModal.value = { modal: "send" })}>
            {t`Send`}
          </Button>
          <Button onClick={() => (openModal.value = { modal: "receive" })}>
            {t`Receive`}
          </Button>
        </SimpleGrid>
      </Flex>
    </>
  );
}
