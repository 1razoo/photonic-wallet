import { CopyIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  AlertDescription,
  Center,
  Button,
  useClipboard,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import RecoveryPhraseWords from "./RecoveryPhraseWords";
import ActionIcon from "./ActionIcon";

export default function RecoveryPhrase({ phrase }: { phrase: string }) {
  const { onCopy, hasCopied } = useClipboard(phrase);

  return (
    <>
      <Alert status="warning" mb={8}>
        <AlertIcon />
        <AlertDescription>
          {t`Your recovery phrase is the only way to restore your wallet after logging out. Keep it in a safe place and never share it.`}
        </AlertDescription>
      </Alert>
      <RecoveryPhraseWords words={phrase.split(" ")} />
      <Center mb={4}>
        <Button
          onClick={onCopy}
          leftIcon={<ActionIcon as={CopyIcon} />}
          variant="ghost"
        >
          {hasCopied ? t`Copied!` : t`Copy to clipboard`}
        </Button>
      </Center>
    </>
  );
}
