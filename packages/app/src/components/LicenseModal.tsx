import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Flex,
  ModalProps,
  Heading,
  Box,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import License from "./License";
import { useState } from "react";

export default function LicenseModal({
  isOpen,
  onProceed,
  onCancel,
}: Pick<ModalProps, "isOpen"> & {
  onProceed: () => void;
  onCancel: () => void;
}) {
  const [agree, setAgree] = useState(false);
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      closeOnOverlayClick={false}
      size="4xl"
      autoFocus={false} // Autofocus will scroll to radio input on mobile
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Notice</ModalHeader>
        <ModalBody>
          <Alert variant="left-accent" status="warning" mb={4}>
            <AlertIcon />
            Photonic Wallet is experimental software. Bugs may be present that
            could result in the loss of funds and assets. Do not send anything
            to this wallet that you are not prepared to lose.
          </Alert>
          <Text mb={2}>
            This program is distributed under the terms of the MIT License.
            Please read the following License Agreement. You must accept the
            terms of this agreement to use Photonic Wallet.
          </Text>
          <Heading size="md" my={4}>
            License
          </Heading>
          <Box bgColor="white" color="black" p={4} mb={4}>
            <License />
          </Box>
          <RadioGroup onChange={(value) => setAgree(value === "1")}>
            <Stack>
              <Radio value="1">
                I accept the terms of the License Agreement
              </Radio>
              <Radio value="0">
                I do not accept the terms of the License Agreement
              </Radio>
            </Stack>
          </RadioGroup>
        </ModalBody>
        <ModalFooter as={Flex} gap={4}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onProceed} isDisabled={!agree}>
            Proceed
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
