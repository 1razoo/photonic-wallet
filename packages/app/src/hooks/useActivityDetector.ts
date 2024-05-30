import { wallet } from "@app/signals";
import { lockWallet } from "@app/wallet";
import { useToast } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { useEffect, useRef } from "react";

type Timeout = ReturnType<typeof setTimeout>;
const LOCK_INACTIVITY_TIME = 600000; // 10 minutes

export default function useActivityDetector() {
  const toast = useToast();
  const timer = useRef<Timeout>();

  const onMouseMove = () => {
    clearTimeout(timer.current);
    if (wallet.value.exists) {
      timer.current = setTimeout(() => {
        lockWallet();
        toast({
          title: t`Wallet locked`,
          status: "success",
        });
      }, LOCK_INACTIVITY_TIME);
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);

    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);
}
