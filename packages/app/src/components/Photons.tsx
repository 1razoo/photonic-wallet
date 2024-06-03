import { photonsToRXD } from "@lib/format";
import { network } from "@app/signals";

export default function Photons({ value }: { value: number }) {
  if (value < 10000) {
    return <>{value}ph</>;
  }
  return (
    <>
      {photonsToRXD(value)} {network.value.ticker}
    </>
  );
}
