import { CopyIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  AlertDescription,
  Center,
  Button,
  useClipboard,
} from "@chakra-ui/react";
import RecoveryPhraseWords from "./RecoveryPhraseWords";

export default function RecoveryPhrase({ phrase }: { phrase: string }) {
  const { onCopy, hasCopied } = useClipboard(phrase);

  return (
    <>
      <Alert status="warning" mb={8}>
        <AlertIcon />
        <AlertDescription>
          Your recovery phrase is the only way to restore your wallet after
          logging out. Keep it in a safe place and never share it.
        </AlertDescription>
      </Alert>
      <RecoveryPhraseWords words={phrase.split(" ")} />
      <Center mb={4}>
        <Button onClick={onCopy} leftIcon={<CopyIcon />} variant="ghost">
          {hasCopied ? "Copied!" : "Copy to clipboard"}
        </Button>
      </Center>
    </>
  );
}
