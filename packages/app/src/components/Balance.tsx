import useBalance from "@app/hooks/useBalance";
import { network, wallet } from "@app/signals";
import { Spinner } from "@chakra-ui/react";
import { photonsToRXD } from "@lib/format";

export default function Balance() {
  const script = wallet.value.address;
  const total = useBalance(script);

  return total === null ? (
    <Spinner size="sm" />
  ) : (
    <>
      {photonsToRXD(total)} {network.value.ticker}
    </>
  );
}
