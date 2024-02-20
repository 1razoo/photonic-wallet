import {
  Alert,
  AlertIcon,
  Box,
  BoxProps,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  GridItem,
  GridProps,
  Heading,
  Image,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useClipboard,
  useDisclosure,
} from "@chakra-ui/react";
import { Trans, t } from "@lingui/macro";
import { bytesToHex } from "@noble/hashes/utils";
import { Buffer } from "buffer";
import { filesize } from "filesize";
import mime from "mime/lite";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import db from "@app/db";
import { CopyIcon, DownloadIcon, InfoIcon } from "@chakra-ui/icons";
import { Address } from "@radiantblockchain/radiantjs";
import Outpoint from "@lib/Outpoint";
import Identifier from "@app/components/Identifier";
import SendAsset from "@app/components/SendAsset";
import Identicon from "@app/components/Identicon";
import { PropsWithChildren, ReactNode, useRef } from "react";
import Card from "@app/components/Card";
import Photons from "@app/components/Photons";
import ContentContainer from "@app/components/ContentContainer";
import DownloadLink from "@app/components/DownloadLink";
import TokenContent from "@app/components/TokenContent";
import AtomType from "@app/components/AtomType";
import PageHeader from "@app/components/PageHeader";
import MeltAsset from "./MeltAsset";
import TxSuccessModal from "./TxSuccessModal";
import { AtomNft, TxO } from "../types";
import { openModal, wallet } from "@app/signals";
import AtomData from "./AtomData";

export const PropertyCard = ({
  heading,
  info,
  children,
  ...rest
}: PropsWithChildren<
  { heading: React.ReactNode; info?: ReactNode } & BoxProps
>) => {
  return (
    <Card
      p={4}
      display="grid"
      gridTemplateAreas={`"heading info" "child child"`}
      gridTemplateColumns="auto 30px"
      {...rest}
    >
      <Heading
        size="sm"
        mb={2}
        color="lightBlue.A400"
        display="flex"
        flexDirection="row"
        alignItems="center"
      >
        {heading}
      </Heading>
      <Box>{info}</Box>
      {children}
    </Card>
  );
};

function Warning({ children }: PropsWithChildren) {
  return (
    <Alert status="warning" as={GridItem} justifyContent="center" colSpan={2}>
      <AlertIcon />
      <Trans>{children}</Trans>
    </Alert>
  );
}

export default function ViewAsset({
  sref,
  context,
  size = "md",
  toolbar,
  ...rest
}: {
  sref: string;
  context?: string;
  size?: "sm" | "md";
  toolbar?: React.ReactNode;
} & GridProps) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const sendDisclosure = useDisclosure();
  const meltDisclosure = useDisclosure();
  const successDisclosure = useDisclosure();
  const [nft, txo, author, container] = useLiveQuery(
    async () => {
      const nft = await db.atomNft.get({ ref: sref });
      if (!nft?.lastTxoId) return [undefined, undefined];
      const txo = await db.txo.get(nft?.lastTxoId);
      const a = nft.author && (await db.atomNft.get({ ref: nft.author }));
      const c = nft.container && (await db.atomNft.get({ ref: nft.container }));
      return [nft, txo, a, c] as [AtomNft, TxO, AtomNft?, AtomNft?];
    },
    [sref],
    [undefined, undefined]
  );
  const txid = useRef("");
  const { onCopy: onLinkCopy } = useClipboard(nft?.main || "");

  // TODO show loading or 404
  if (!txo || !nft) {
    return (
      <ContentContainer>
        <PageHeader />
      </ContentContainer>
    );
  }

  const ref = Outpoint.fromString(txo.script.substring(2, 74)).reverse();
  const hexAddr = txo.script.substring(82, 122);
  const owner = new Address(
    Buffer.from(hexAddr, "hex"),
    wallet.value.net
  ).toString();

  const location = Outpoint.fromUTXO(txo.txid, txo.vout);
  const atom = ref.ref("i");
  const authorRef = nft?.author && Outpoint.fromString(nft.author);
  const containerRef = nft?.container && Outpoint.fromString(nft.container);

  const unlock = (fn: () => void) => {
    if (wallet.value.locked) {
      openModal.value = { modal: "unlock" };
    } else {
      fn();
    }
  };

  const openSend = () => sendDisclosure.onOpen();

  const openMelt = () => meltDisclosure.onOpen();

  const openSuccess = (id: string) => {
    txid.current = id;
    successDisclosure.onOpen();
  };

  const hasAttrs = nft?.attrs && Object.keys(nft.attrs).length > 0;
  const isIPFS = nft.main?.startsWith("ipfs://");
  const isKnownEmbed = [
    ".txt",
    ".jpg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".avif",
  ].includes(nft?.filename?.substring(nft?.filename?.lastIndexOf(".")) || "");

  return (
    <>
      <Grid gridTemplateRows="auto 1fr" height="100vh" {...rest}>
        <PageHeader close to={`${context}${search}`} toolbar={toolbar}>
          {nft?.name || t`Unnamed token`}
        </PageHeader>
        <Container maxW="container.xl" overflowY="auto" pb={4}>
          <Grid
            columnGap={8}
            rowGap={4}
            templateColumns={
              size === "sm" ? "1fr" : { base: "1fr", xl: "2fr 3fr" }
            }
            alignItems="start"
          >
            <SimpleGrid columns={2} gap={2}>
              <GridItem
                p={4}
                minHeight="250px"
                alignItems="center"
                justifyContent="center"
                position="relative"
                as={Card}
                colSpan={2}
                sx={{
                  "& img": {
                    maxWidth: "400px",
                    maxHeight: "400px",
                  },
                }}
              >
                {nft && <TokenContent nft={nft} />}
              </GridItem>
              {nft?.file && !isKnownEmbed && (
                <Warning>Files may be unsafe</Warning>
              )}
              {!nft?.file && nft.main && !isIPFS && (
                <Warning>
                  URLs may be unsafe and result in loss of funds
                </Warning>
              )}
              {nft?.file && (
                <GridItem
                  as={DownloadLink}
                  data={nft.file}
                  filename={nft.filename}
                  leftIcon={<DownloadIcon />}
                  colSpan={2}
                >
                  {t`Download`}
                </GridItem>
              )}
              {!nft?.file && nft.main && (
                <>
                  <GridItem
                    as={Button}
                    onClick={onLinkCopy}
                    leftIcon={<CopyIcon />}
                    colSpan={2}
                  >
                    {t`Copy URL`}
                  </GridItem>
                </>
              )}
              {/* Edit mutable token, for testing purposes only
              {nft.immutable === false && (
                <>
                  <EditTokenTest token={nft} txo={txo} />
                  <FetchTokenTest token={nft} />
                </>
              )}
              */}
              <Button onClick={() => unlock(openSend)}>Send</Button>
              <Button
                onClick={() => unlock(openMelt)}
                _hover={{ bg: "red.600" }}
              >
                {t`Melt`}
              </Button>
            </SimpleGrid>
            <div>
              <Tabs>
                <TabList>
                  <Tab>Details</Tab>
                  <Tab>Inspect</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    {nft?.description && (
                      <PropertyCard heading={t`Description`} mb={4}>
                        {nft.description}
                      </PropertyCard>
                    )}
                    <PropertyCard heading="Atomical ID" mb={4}>
                      <div>
                        <Identicon
                          value={ref.refHash()}
                          width="24px"
                          height="24px"
                          sx={{ svg: { height: "26px" } }}
                          float="left"
                        />
                        <Identifier showCopy copyValue={ref.ref()}>
                          {atom}
                        </Identifier>
                      </div>
                    </PropertyCard>
                    {authorRef && (
                      <PropertyCard heading="Author" mb={4}>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          {author?.name ? (
                            <Text>{author.name}</Text>
                          ) : (
                            <Text fontStyle="italic">
                              &lt;Unnamed author&gt;
                            </Text>
                          )}
                          <div>
                            <Identicon
                              value={authorRef.refHash()}
                              width="24px"
                              height="24px"
                              sx={{ svg: { height: "26px" } }}
                              float="left"
                            />
                            <Identifier showCopy copyValue={authorRef.ref()}>
                              {authorRef.shortRef()}
                            </Identifier>
                          </div>
                        </Flex>
                      </PropertyCard>
                    )}
                    {containerRef && (
                      <PropertyCard heading="Container" mb={4}>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          {container?.name ? (
                            <Text>{container.name}</Text>
                          ) : (
                            <Text fontStyle="italic">
                              &lt;Unnamed container&gt;
                            </Text>
                          )}
                          <div>
                            <Identicon
                              value={containerRef.refHash()}
                              width="24px"
                              height="24px"
                              sx={{ svg: { height: "26px" } }}
                              float="left"
                            />
                            <Identifier showCopy copyValue={containerRef.ref()}>
                              {containerRef.shortRef()}
                            </Identifier>
                          </div>
                        </Flex>
                      </PropertyCard>
                    )}
                    <SimpleGrid columns={[1, 2]} spacing={4}>
                      {isIPFS && (
                        <PropertyCard heading={t`IPFS CID`}>
                          <div>
                            <Identifier showCopy>
                              {nft.main?.replace("ipfs://", "")}
                            </Identifier>
                          </div>
                        </PropertyCard>
                      )}
                      {nft.hashstamp && (
                        <PropertyCard
                          heading="HashStamp"
                          info={
                            <Tooltip
                              label={t`A HashStamp is a compressed on-chain copy of the token image, displayed alongside the SHA-256 of the original file`}
                              placement="bottom-end"
                              hasArrow
                            >
                              <InfoIcon
                                right={0}
                                color="gray.400"
                                display={{ base: "none", md: "block" }}
                              />
                            </Tooltip>
                          }
                        >
                          <Flex gap={4}>
                            <Image
                              src={`data:image/webp;base64, ${btoa(
                                String.fromCharCode(
                                  ...new Uint8Array(nft.hashstamp)
                                )
                              )}`}
                              width="64px"
                              height="64px"
                              objectFit="contain"
                              backgroundColor="white"
                            />
                            {nft.hash && (
                              <div>
                                <Identifier>
                                  {bytesToHex(new Uint8Array(nft.hash))}
                                </Identifier>
                              </div>
                            )}
                          </Flex>
                        </PropertyCard>
                      )}
                      <PropertyCard heading={t`Owner`}>
                        <div>
                          <Identifier showCopy>{owner}</Identifier>
                        </div>
                      </PropertyCard>
                      <PropertyCard heading={t`Output value`}>
                        <Photons value={txo.value} />
                      </PropertyCard>
                      {nft?.type && (
                        <PropertyCard heading={t`Type`}>
                          <AtomType type={nft?.type} />
                        </PropertyCard>
                      )}
                      <PropertyCard heading={t`Mint`}>
                        <div>
                          <Identifier showCopy copyValue={ref.ref("i")}>
                            {ref.shortInput()}
                          </Identifier>
                        </div>
                      </PropertyCard>
                      <PropertyCard heading={t`Location`}>
                        <div>
                          <Identifier showCopy copyValue={txo.txid}>
                            {location.shortOutput()}
                          </Identifier>
                        </div>
                      </PropertyCard>
                      {/* Temporarily disabled. See comment regarding date in buildUpdateTXOs.
                      <PropertyCard heading={t`Received`}>
                        {txo.date
                          ? dayjs(txo.date * 1000).format("lll")
                          : "Unconfirmed"}
                      </PropertyCard>
                      */}
                      <PropertyCard heading={t`Height`}>
                        {txo.height === Infinity ? t`Unconfirmed` : txo.height}
                      </PropertyCard>
                      {nft?.file && nft?.main && (
                        <>
                          <PropertyCard heading={t`Content length`}>
                            {filesize(nft.file.byteLength) as string}
                          </PropertyCard>
                          <PropertyCard heading={t`Content type`}>
                            {mime.getType(nft.main)}
                          </PropertyCard>
                        </>
                      )}
                    </SimpleGrid>
                    {hasAttrs && (
                      <>
                        <Divider my={4} />
                        <SimpleGrid
                          columns={[1, 2]}
                          spacing={4}
                          gridAutoRows="1fr"
                        >
                          {Object.entries(nft.attrs).map(([k, v]) => (
                            <PropertyCard heading={k} key={k}>
                              {v}
                            </PropertyCard>
                          ))}
                        </SimpleGrid>
                      </>
                    )}
                  </TabPanel>
                  <TabPanel px={0}>
                    <AtomData sref={sref} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </div>
          </Grid>
        </Container>
      </Grid>
      <SendAsset
        asset={txo}
        disclosure={sendDisclosure}
        onSuccess={(txid) => {
          sendDisclosure.onClose();
          openSuccess(txid);
        }}
      />
      <MeltAsset
        asset={txo}
        disclosure={meltDisclosure}
        onSuccess={(txid: string) => {
          meltDisclosure.onClose();
          openSuccess(txid);
        }}
      />
      <TxSuccessModal
        onClose={() => {
          successDisclosure.onClose;
          navigate(context || "/objects");
        }}
        isOpen={successDisclosure.isOpen}
        txid={txid.current}
      />
    </>
  );
}
