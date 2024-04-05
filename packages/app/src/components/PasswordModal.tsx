import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  ModalCloseButton,
  Alert,
  AlertDescription,
  AlertIcon,
  ModalProps,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import Wallet from "@app/wallet/wallet";
import { wallet } from "@app/signals";

interface Props {
  header: string;
  allowClose?: boolean;
  onSuccess?: (mnemonic: string, wif: string) => void;
}

export default function PasswordModal({
  header,
  allowClose = false,
  onSuccess,
  isOpen,
  onClose = () => undefined,
  ...rest
}: Props & Partial<ModalProps>) {
  const password = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);

  useEffect(() => {
    setSuccess(true);
    setLoading(false);
  }, [isOpen]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(true);
    setLoading(true);

    requestAnimationFrame(async () => {
      const pwd: string = password.current?.value || "";
      try {
        const { mnemonic, wif } = await Wallet.open(wallet.value.net, pwd);

        onSuccess && onSuccess(mnemonic, wif);
      } catch (error) {
        setSuccess(false);
        setLoading(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      closeOnOverlayClick={allowClose}
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={password}
      isCentered
      {...rest}
    >
      <form onSubmit={submit}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{header}</ModalHeader>
          {allowClose && <ModalCloseButton />}
          <ModalBody pb={6}>
            {success || (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <AlertDescription>{t`Incorrect password`}</AlertDescription>
              </Alert>
            )}
            <FormControl>
              <FormLabel>{t`Password`}</FormLabel>
              <Input ref={password} type="password" placeholder={t`Password`} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" isLoading={loading}>
              {t`Unlock`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
}
