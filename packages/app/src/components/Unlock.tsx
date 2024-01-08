import { useRef } from "react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import PasswordModal from "./PasswordModal";
import { openModal, wallet } from "@app/signals";
import useModalSignal from "@app/hooks/useModalSignal";

export default function Unlock() {
  const toast = useToast();
  const disclosure = useDisclosure();
  const { exists, locked } = wallet.value;
  const onCloseCallback = useRef<(success: boolean) => void>();

  const open = (onClose?: (success: boolean) => void) => {
    if (exists && locked) {
      onCloseCallback.current = onClose;
      disclosure.onOpen();
    } else {
      onClose && onClose(false);
    }
  };

  useModalSignal(openModal, "unlock", open);

  const onSuccess = (_: string, wif: string) => {
    toast({
      title: "Wallet unlocked",
      status: "success",
    });

    if (wif) {
      wallet.value = {
        ...wallet.value,
        locked: false,
        wif,
      };
    }

    disclosure.onClose();
    if (onCloseCallback.current) {
      onCloseCallback.current(true);
    }
  };

  const onClose = () => {
    disclosure.onClose();
    if (onCloseCallback.current) {
      onCloseCallback.current(false);
    }
  };

  return (
    <PasswordModal
      header="Unlock to enable spending"
      allowClose
      onSuccess={onSuccess}
      isOpen={disclosure.isOpen}
      onClose={onClose}
    />
  );
}
