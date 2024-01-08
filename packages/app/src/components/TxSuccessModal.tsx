import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ModalCloseButton,
  Text,
  ModalProps,
  Link,
} from "@chakra-ui/react";
import Identifier from "./Identifier";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import createExplorerUrl from "@app/network/createExplorerUrl";

export default function TxSuccessModal({
  isOpen,
  onClose,
  txid,
}: Pick<ModalProps, "isOpen" | "onClose"> & {
  txid: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      isCentered
      size="lg"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Transaction successful</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={2}>Transaction ID:</Text>
          <div>
            <Identifier showCopy>{txid}</Identifier>
          </div>
          <Link
            as={RouterLink}
            to={createExplorerUrl(txid)}
            target="_blank"
            isExternal
            my={4}
          >
            View on block explorer
            <ExternalLinkIcon mx="2px" />
          </Link>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
