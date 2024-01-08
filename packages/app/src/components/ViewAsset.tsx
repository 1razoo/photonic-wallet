import {
  Alert,
  AlertIcon,
  AlertTitle,
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
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { bytesToHex } from "@noble/hashes/utils";
import { Buffer } from "buffer";
import { filesize } from "filesize";
import mime from "mime/lite";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import db from "@app/db";
import { DownloadIcon, InfoIcon } from "@chakra-ui/icons";
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
import LinkButton from "./LinkButton";
import MeltAsset from "./MeltAsset";
import TxSuccessModal from "./TxSuccessModal";
import { AtomNft, TxO } from "../types";
import { openModal, wallet } from "@app/signals";

const Meta = ({
  heading,
  info,
  children,
  ...rest
}: PropsWithChildren<{ heading: string; info?: ReactNode } & BoxProps>) => {
  return (
    <Card
      p={4}
      display="grid"
      gridArea={`"heading info" "child child"`}
      gridTemplateColumns="auto 30px"
      {...rest}
    >
      <Heading size="xs" mb={2} color="lightBlue.A400">
        {heading}
      </Heading>
      <Box>{info}</Box>
      {children}
    </Card>
  );
};

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
  const [nft, txo] = useLiveQuery(
    async () => {
      const nft = await db.atomNft.get({ ref: sref });
      if (!nft?.lastTxoId) return [undefined, undefined];
      const txo = await db.txo.get(nft?.lastTxoId);
      return [nft, txo] as [AtomNft, TxO];
    },
    [sref],
    [undefined, undefined]
  );
  const txid = useRef("");

  // FIXME show loading or 404
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
  const author = nft?.author && Outpoint.fromString(nft.author).reverse();
  const container =
    nft?.container && Outpoint.fromString(nft.container).reverse();

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
  ].includes(nft?.main?.substring(nft?.main?.lastIndexOf(".")) || "");

  return (
    <>
      <Grid gridTemplateRows="auto 1fr" height="100vh" {...rest}>
        <PageHeader close to={`${context}${search}`} toolbar={toolbar}>
          {nft?.name || "Unnamed token"}
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
                    maxWidth: "600px",
                    maxHeight: "600px",
                  },
                }}
              >
                {nft && <TokenContent nft={nft} />}
              </GridItem>
              {nft?.file && !isKnownEmbed && (
                <Alert
                  status="error"
                  as={GridItem}
                  justifyContent="center"
                  colSpan={2}
                >
                  <AlertIcon />
                  <AlertTitle>Caution:</AlertTitle>
                  Files may be unsafe
                </Alert>
              )}
              {nft?.file && (
                <GridItem
                  as={DownloadLink}
                  data={nft.file}
                  filename={nft.filename}
                  leftIcon={<DownloadIcon />}
                  colSpan={2}
                >
                  Download
                </GridItem>
              )}
              {!nft?.file && nft.main && (
                <>
                  {nft.main.startsWith("ipfs://") || isKnownEmbed ? (
                    <GridItem
                      as={LinkButton}
                      to={nft.main}
                      target="_blank"
                      download
                      leftIcon={<DownloadIcon />}
                      colSpan={2}
                    >
                      Download
                    </GridItem>
                  ) : (
                    <Alert
                      status="error"
                      as={GridItem}
                      justifyContent="center"
                      colSpan={2}
                    >
                      <AlertIcon />
                      <AlertTitle>Caution:</AlertTitle>
                      URLs may be unsafe and result in loss of funds
                    </Alert>
                  )}
                </>
              )}
              <Button onClick={() => unlock(openSend)}>Send</Button>
              <Button
                onClick={() => unlock(openMelt)}
                _hover={{ bg: "red.600" }}
              >
                Melt
              </Button>
            </SimpleGrid>
            <div>
              <Meta heading="Ref" mb={4}>
                <div>
                  <Identicon
                    value={ref.refHash()}
                    width="26px"
                    height="24px"
                    sx={{ svg: { height: "26px" } }}
                    float="left"
                  />
                  <Identifier showCopy copyValue={atom}>
                    {atom}
                  </Identifier>
                </div>
              </Meta>
              {author && (
                <Meta heading="Author" mb={4}>
                  <div>
                    <Identicon
                      value={author.refHash()}
                      width="26px"
                      height="24px"
                      sx={{ svg: { height: "26px" } }}
                      float="left"
                    />
                    <Identifier showCopy>{author.ref("i")}</Identifier>
                  </div>
                </Meta>
              )}
              {container && (
                <Meta heading="Container" mb={4}>
                  <div>
                    <Identicon
                      value={container.refHash()}
                      width="26px"
                      height="24px"
                      sx={{ svg: { height: "26px" } }}
                      float="left"
                    />
                    <Identifier showCopy>{container.ref("i")}</Identifier>
                  </div>
                </Meta>
              )}
              <SimpleGrid columns={[1, 2]} spacing={4}>
                {isIPFS && (
                  <Meta heading="IPFS CID">
                    <div>
                      <Identifier showCopy>
                        {nft.main?.replace("ipfs://", "")}
                      </Identifier>
                    </div>
                  </Meta>
                )}
                {nft.hashstamp && (
                  <Meta
                    heading="HashStamp"
                    info={
                      <Tooltip
                        label="A HashStamp is a compressed on-chain copy of the token image, displayed alongside the SHA-256 of the original file"
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
                          String.fromCharCode(...new Uint8Array(nft.hashstamp))
                        )}`}
                        width="64px"
                        height="64px"
                        objectFit="contain"
                        sx={{ imageRendering: "pixelated" }}
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
                  </Meta>
                )}
                <Meta heading="Owner">
                  <div>
                    <Identifier showCopy>{owner}</Identifier>
                  </div>
                </Meta>
                <Meta heading="Output value">
                  <Photons value={txo.value} />
                </Meta>
                {nft?.type && (
                  <Meta heading="Type">
                    <AtomType type={nft?.type} />
                  </Meta>
                )}
                <Meta heading="Mint">
                  <div>
                    <Identifier showCopy copyValue={ref.ref("i")}>
                      {ref.shortInput()}
                    </Identifier>
                  </div>
                </Meta>
                <Meta heading="Location">
                  <div>
                    <Identifier showCopy copyValue={txo.txid}>
                      {location.shortOutput()}
                    </Identifier>
                  </div>
                </Meta>
                <Meta heading="Received">
                  {txo.date
                    ? dayjs(txo.date * 1000).format("lll")
                    : "Unconfirmed"}
                </Meta>
                <Meta heading="Height">
                  {txo.height === Infinity ? "Unconfirmed" : txo.height}
                </Meta>
                {nft?.file && nft?.main && (
                  <>
                    <Meta heading="Content length">
                      {filesize(nft.file.byteLength) as string}
                    </Meta>
                    <Meta heading="Content type">{mime.getType(nft.main)}</Meta>
                  </>
                )}
              </SimpleGrid>
              {(nft?.description || hasAttrs) && <Divider my={4} />}
              {nft?.description && (
                <Meta heading="Description" mb={4}>
                  {nft.description}
                </Meta>
              )}
              {hasAttrs && (
                <>
                  <SimpleGrid columns={[1, 2]} spacing={4} gridAutoRows="1fr">
                    {Object.entries(nft.attrs).map(([k, v]) => (
                      <Meta heading={k} key={k}>
                        {v}
                      </Meta>
                    ))}
                  </SimpleGrid>
                </>
              )}
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
