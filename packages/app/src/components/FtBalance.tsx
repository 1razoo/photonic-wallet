import useBalance from "@app/hooks/useBalance";
import { Spinner } from "@chakra-ui/react";

export default function FtBalance({
  id,
  ticker,
}: {
  id: string;
  ticker?: string;
}) {
  const total = useBalance(id);

  return total === null ? (
    <Spinner size="sm" />
  ) : (
    <>
      {total} {ticker}
    </>
  );
}
