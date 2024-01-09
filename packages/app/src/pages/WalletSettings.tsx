import { ChangeEventHandler, useRef, useState } from "react";
import { t } from "@lingui/macro";
import {
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import PasswordModal from "@app/components/PasswordModal";
import RecoveryPhrase from "@app/components/RecoveryPhrase";
import { language, wallet } from "@app/signals";
import FormSection from "@app/components/FormSection";
import db from "@app/db";
import { loadCatalog } from "@app/i18n";
import config from "@app/config.json";
import { useLiveQuery } from "dexie-react-hooks";
import { PromiseExtended } from "dexie";

export default function WalletSettings() {
  const disclosure = useDisclosure();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const passwordSuccess = (walletMnemonic: string) => {
    setMnemonic(walletMnemonic as string);
    setShowMnemonic(true);
    disclosure.onClose();
  };
  const languageRef = useRef<HTMLSelectElement>(null);

  const savedLanguage = useLiveQuery(
    () => db.kvp.get("language") as PromiseExtended<string>,
    [],
    null
  );

  const changeLanguage: ChangeEventHandler<HTMLSelectElement> = async ({
    target: { value },
  }) => {
    // Save to DB. This is only used when loading the app.
    db.kvp.put(value, "language");
    // Change language
    await loadCatalog(value);
    // Trigger rerender on the currently rendered components
    language.value = value;
  };

  if (savedLanguage === null) return null;

  return (
    <Container maxW="container.md" px={4} display="grid" gap={8}>
      <FormSection>
        <Heading size="md">{t`Address`}</Heading>
        <Text pt="2" fontSize="sm">
          {wallet.value.address}
        </Text>
      </FormSection>

      <FormSection>
        <Heading size="md" mb={8}>
          {t`Recovery phrase`}
        </Heading>
        {showMnemonic ? (
          <RecoveryPhrase phrase={mnemonic} />
        ) : (
          <Center mt={8} mb={16}>
            <Button onClick={() => disclosure.onOpen()}>
              {t`Show recovery phrase`}
            </Button>
          </Center>
        )}
        <PasswordModal
          header={t`Enter password`}
          allowClose
          onSuccess={passwordSuccess}
          isOpen={disclosure.isOpen}
          onClose={disclosure.onClose}
        />
      </FormSection>

      <FormSection>
        <FormControl>
          <FormLabel>{t`Language`}</FormLabel>
          <Select
            ref={languageRef}
            onChange={changeLanguage}
            defaultValue={savedLanguage || ""}
          >
            {Object.entries(config.i18n.languages).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormControl>
      </FormSection>
    </Container>
  );
}
