import { useRef } from "react";
import { useDisclosure } from "@chakra-ui/react";
import SendRXD from "./SendRXD";
import ReceiveRXD from "./ReceiveRXD";
import TxSuccessModal from "./TxSuccessModal";
import { openModal, wallet } from "@app/signals";
import useModalSignal from "@app/hooks/useModalSignal";

export default function SendReceive() {
  const sendDisclosure = useDisclosure();
  const receiveDisclosure = useDisclosure();
  const successDisclosure = useDisclosure();
  const txid = useRef("");

  const receive = () => receiveDisclosure.onOpen();

  const unlockAndSend = () => {
    if (wallet.value.locked) {
      openModal.value = {
        modal: "unlock",
        onClose: (success: boolean) => success && openSend(),
      };
    } else {
      openSend();
    }
  };

  const openSend = () => sendDisclosure.onOpen();

  const openSuccess = (id: string) => {
    txid.current = id;
    successDisclosure.onOpen();
  };

  useModalSignal(openModal, "send", unlockAndSend);
  useModalSignal(openModal, "receive", receive);

  return (
    <>
      <SendRXD
        disclosure={sendDisclosure}
        onSuccess={(txid) => {
          openSuccess(txid);
          sendDisclosure.onClose();
        }}
      />
      <ReceiveRXD disclosure={receiveDisclosure} />
      <TxSuccessModal
        onClose={successDisclosure.onClose}
        isOpen={successDisclosure.isOpen}
        txid={txid.current}
      />
    </>
  );
}
