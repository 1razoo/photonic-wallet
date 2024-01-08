import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  ModalCloseButton,
  UseDisclosureProps,
  Box,
  useClipboard,
} from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { QRCodeSVG } from "qrcode.react";
import Identifier from "./Identifier";
import { network, wallet } from "@app/signals";

interface Props {
  disclosure: UseDisclosureProps;
}

export default function ReceiveRXD({ disclosure }: Props) {
  const { address } = wallet.value;
  const { isOpen, onClose } = disclosure;
  const { onCopy, hasCopied } = useClipboard(address);

  if (!isOpen || !onClose) return null;

  return (
    <Modal closeOnOverlayClick isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent m={4}>
        <ModalHeader>Receive</ModalHeader>
        <ModalCloseButton />
        <ModalBody alignItems="center" pb={8}>
          <Box mb={4}>
            Send {network.value.name} coins and tokens to this address
          </Box>
          <Box borderRadius="md" overflow="hidden" mb={4}>
            <QRCodeSVG size={256} value={address} includeMargin />
          </Box>
          <Identifier>{address}</Identifier>
          <Button
            onClick={onCopy}
            leftIcon={<CopyIcon />}
            variant="ghost"
            mt={2}
          >
            {hasCopied ? "Copied!" : "Copy to clipboard"}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
