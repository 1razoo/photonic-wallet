import { Button, Flex, FlexProps, Grid, Spinner } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { photonsToRXD } from "@lib/format";
import { balance, network, openModal, totalBalance } from "@app/signals";
import ValueTag from "./ValueTag";
import ActionIcon from "./ActionIcon";
import { TbArrowDownLeft, TbArrowUpRight } from "react-icons/tb";

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
        <Grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={4}>
          <Button
            size={{ base: "sm", "2xl": "md" }}
            leftIcon={<ActionIcon as={TbArrowDownLeft} />}
            onClick={() => (openModal.value = { modal: "receive" })}
          >
            {t`Receive`}
          </Button>
          <Button
            size={{ base: "sm", "2xl": "md" }}
            leftIcon={<ActionIcon as={TbArrowUpRight} />}
            onClick={() => (openModal.value = { modal: "send" })}
          >
            {t`Send`}
          </Button>
        </Grid>
      </Flex>
    </>
  );
}
