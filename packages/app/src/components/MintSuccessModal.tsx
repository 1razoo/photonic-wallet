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
  Flex,
  ModalProps,
  Link,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import Identifier from "./Identifier";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import createExplorerUrl from "@app/network/createExplorerUrl";

export default function MintSuccessModal({
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
        <ModalHeader>{t`Mint successful`}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={2}>{t`Transaction ID:`}</Text>
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
            {t`View on block explorer`}
            <ExternalLinkIcon mx="2px" />
          </Link>
        </ModalBody>

        <ModalFooter as={Flex} gap={4}>
          <Button onClick={onClose}>{t`Mint another`}</Button>
          <Button as={RouterLink} to="/create">
            {t`Back to dashboard`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
