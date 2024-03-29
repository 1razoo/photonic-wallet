import { useRef } from "react";
import { Trans, t } from "@lingui/macro";
import { Link } from "react-router-dom";
import { PromiseExtended } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Button,
  Code,
  Container,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Select,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import FormSection from "@app/components/FormSection";
import db from "@app/db";

export default function IpfsSettings() {
  const nftStorageApiKeyRef = useRef<HTMLTextAreaElement>(null);
  const ipfsMethodRef = useRef<HTMLSelectElement>(null);
  const ipfsGatewayUrlRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const keys = ["nftStorageApiKey", "ipfsMethod", "ipfsGatewayUrl"];
  const save = () => {
    db.kvp.bulkPut(
      [
        nftStorageApiKeyRef.current?.value,
        ipfsMethodRef.current?.value,
        ipfsGatewayUrlRef.current?.value,
      ],
      keys
    );
    toast({
      title: t`Saved`,
      status: "success",
    });
  };

  const response = useLiveQuery(
    async () => await (db.kvp.bulkGet(keys) as PromiseExtended<string[]>),
    [],
    null
  );

  if (response === null) return null;

  const [apiKey, ipfsMethod, ipfsGatewayUrl] = response;

  return (
    <Container as={Grid} maxW="container.lg" gap={4} pt={8}>
      <FormSection>
        <FormControl>
          <FormLabel>{t`NFT.Storage API Key`}</FormLabel>
          <Textarea
            ref={nftStorageApiKeyRef}
            placeholder={t`API key`}
            name="nftStorageKey"
            height={{ base: "200px", md: "120px" }}
            defaultValue={apiKey}
          />
          <FormHelperText>
            <Trans>
              An NFT.Storage API key is required for uploading files to IPFS.
              Generate a key at{" "}
              <Link to="https://nft.storage" target="_blank">
                https://nft.storage
              </Link>
              .
            </Trans>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>{t`Method to resolve IPFS token content`}</FormLabel>
          <Select ref={ipfsMethodRef} defaultValue={ipfsMethod || "gateway"}>
            <option value="gateway">{t`Gateway`}</option>
            <option value="default">{t`Default`}</option>
          </Select>
          <FormHelperText>
            <Trans>
              Default setting will use <Code>ipfs://</Code> URLs which will be
              handled according to your browser's configuration
            </Trans>
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>{t`IPFS Gateway URL`}</FormLabel>
          <Input
            ref={ipfsGatewayUrlRef}
            placeholder={t`IPFS gateway`}
            name="gateway"
            defaultValue={ipfsGatewayUrl}
          />
        </FormControl>
      </FormSection>
      <Flex justifyContent="center" py={8} mb={16}>
        <Button size="lg" w="240px" maxW="100%" shadow="dark-md" onClick={save}>
          {t`Save`}
        </Button>
      </Flex>
    </Container>
  );
}
