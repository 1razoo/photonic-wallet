import { useState } from "react";
import {
  Button,
  Center,
  Container,
  Heading,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import PasswordModal from "@app/components/PasswordModal";
import RecoveryPhrase from "@app/components/RecoveryPhrase";
import Card from "@app/components/Card";
import { wallet } from "@app/signals";

export default function WalletSettings() {
  const disclosure = useDisclosure();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const passwordSuccess = (walletMnemonic: string) => {
    setMnemonic(walletMnemonic as string);
    setShowMnemonic(true);
    disclosure.onClose();
  };

  return (
    <Container maxW="container.md" px={4}>
      <Card>
        <Heading size="md">Address</Heading>
        <Text pt="2" fontSize="sm">
          {wallet.value.address}
        </Text>
      </Card>

      <Card mt={8}>
        <Heading size="md" mb={8}>
          Recovery phrase
        </Heading>
        {showMnemonic ? (
          <RecoveryPhrase phrase={mnemonic} />
        ) : (
          <Center mt={8} mb={16}>
            <Button onClick={() => disclosure.onOpen()}>
              Show recovery phrase
            </Button>
          </Center>
        )}
        <PasswordModal
          header="Enter password"
          allowClose
          onSuccess={passwordSuccess}
          isOpen={disclosure.isOpen}
          onClose={disclosure.onClose}
        />
      </Card>
    </Container>
  );
}
