import { t } from "@lingui/macro";
import db from "@app/db";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import opfs from "@app/opfs";

export default function LogOut() {
  const logout = async () => {
    await db.delete();
    await opfs.deleteAll();
    document.location = "/";
  };

  return (
    <Container maxW="container.lg">
      <Heading mb={4} size="md">{t`Log out`}</Heading>
      <Text mb={4}>
        {t`Logging out will remove your wallet and all saved data from your browser.`}
      </Text>
      <Alert status="error">
        <AlertIcon />
        <AlertDescription>
          {t`Ensure you have saved your recovery phrase before logging out! Your recovery phrase is the only way you can recreate your wallet.`}
        </AlertDescription>
      </Alert>
      <Flex justifyContent="center" py={8} mb={16}>
        <Button
          size="lg"
          w="240px"
          maxW="100%"
          shadow="dark-md"
          onClick={logout}
        >
          {t`Log out`}
        </Button>
      </Flex>
    </Container>
  );
}
