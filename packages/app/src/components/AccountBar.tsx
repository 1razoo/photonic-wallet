import { Button, Flex, FlexProps, SimpleGrid, Spinner } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { photonsToRXD } from "@lib/format";
import { balance, network, openModal, totalBalance } from "@app/signals";
import ValueTag from "./ValueTag";

export default function AccountBar(props: FlexProps) {
  return (
    <>
      <Flex flexDir="column" alignItems="center" mx={4} {...props}>
        <ValueTag mb={6}>
          {balance.value.ready ? (
            <>
              {photonsToRXD(totalBalance.value)} {network.value.ticker}
            </>
          ) : (
            <Spinner size="sm" />
          )}
        </ValueTag>
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
