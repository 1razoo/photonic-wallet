import {
  Alert,
  AlertIcon,
  Box,
  BoxProps,
  Button,
  Container,
  Grid,
  GridItem,
  GridProps,
  Heading,
  Icon,
  IconButton,
  SimpleGrid,
  useClipboard,
  useDisclosure,
} from "@chakra-ui/react";
import { Trans, t } from "@lingui/macro";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useLocation, useNavigate } from "react-router-dom";
import db from "@app/db";
import { CopyIcon, DownloadIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import Outpoint from "@lib/Outpoint";
import Identifier from "@app/components/Identifier";
import SendDigitalObject from "@app/components/SendDigitalObject";
import { PropsWithChildren, ReactNode, useRef } from "react";
import Card from "@app/components/Card";
import Photons from "@app/components/Photons";
import ContentContainer from "@app/components/ContentContainer";
import DownloadLink from "@app/components/DownloadLink";
import TokenContent from "@app/components/TokenContent";
import AtomTokenType from "@app/components/AtomTokenType";
import PageHeader from "@app/components/PageHeader";
import MeltDigitalObject from "./MeltDigitalObject";
import TxSuccessModal from "./TxSuccessModal";
import { Atom, TxO } from "../types";
import { openModal, wallet } from "@app/signals";
import TokenDetails from "./TokenDetails";
import createExplorerUrl from "@app/network/createExplorerUrl";
import { RiContractRightLine, RiExpandLeftLine } from "react-icons/ri";
import { useViewPanelContext } from "@app/layouts/ViewPanelLayout";
import ActionIcon from "./ActionIcon";
import { MdDeleteForever } from "react-icons/md";
import { TbArrowUpRight } from "react-icons/tb";

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

export default function ViewDigitalObject({
  sref,
  context,
  ...rest
}: {
  sref: string;
  context?: string;
} & GridProps) {
  const [collapsed, setCollapsed] = useViewPanelContext();
  const size = collapsed ? "md" : "sm";
  const { search } = useLocation();
  const navigate = useNavigate();
  const sendDisclosure = useDisclosure();
  const meltDisclosure = useDisclosure();
  const successDisclosure = useDisclosure();
  const [nft, txo, author, container] = useLiveQuery(
    async () => {
      const nft = await db.atom.get({ ref: sref });
      if (!nft?.lastTxoId) return [undefined, undefined];
      const txo = await db.txo.get(nft.lastTxoId);
      const a = nft?.author && (await db.atom.get({ ref: nft.author }));
      const c = nft?.container && (await db.atom.get({ ref: nft.container }));
      return [nft, txo, a, c] as [Atom, TxO, Atom?, Atom?];
    },
    [sref],
    []
  );
  const txid = useRef("");
  const { onCopy: onLinkCopy } = useClipboard(nft?.fileSrc || "");

  // TODO show loading or 404
  if (!txo || !nft) {
    return (
      <ContentContainer>
        <PageHeader />
      </ContentContainer>
    );
  }

  const unlock = (fn: () => void) => {
    if (wallet.value.locked) {
      openModal.value = { modal: "unlock", onClose: fn };
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

  const isIPFS = nft.fileSrc?.startsWith("ipfs://");
  const isKnownEmbed = [
    ".txt",
    ".jpg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".avif",
  ].includes(nft.filename?.substring(nft.filename?.lastIndexOf(".")) || "");
  const location = Outpoint.fromUTXO(txo.txid, txo.vout);

  return (
    <>
      <Grid gridTemplateRows="auto 1fr" height="100vh" {...rest}>
        <PageHeader
          close
          to={`${context}${search}`}
          toolbar={
            <IconButton
              display={{ base: "none", "2xl": "flex" }}
              isRound
              aria-label="Back"
              variant="ghost"
              icon={
                <Icon
                  as={collapsed ? RiContractRightLine : RiExpandLeftLine}
                  fontSize="2xl"
                />
              }
              onClick={() => setCollapsed(!collapsed)}
            />
          }
        >
          {nft.name || t`Unnamed token`}
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
                <TokenContent atom={nft} />
              </GridItem>
              {nft.file && !isKnownEmbed && (
                <Warning>{t`Files may be unsafe and result in loss of funds`}</Warning>
              )}
              {!nft.file && nft.fileSrc && !isIPFS && (
                <Warning>
                  {t`URLs may be unsafe and result in loss of funds`}
                </Warning>
              )}
              {nft.file && (
                <GridItem
                  as={DownloadLink}
                  data={nft.file}
                  filename={nft.filename}
                  leftIcon={<ActionIcon as={DownloadIcon} />}
                  colSpan={2}
                >
                  {t`Download`}
                </GridItem>
              )}
              {!nft.file && nft.fileSrc && (
                <>
                  <GridItem
                    as={Button}
                    onClick={onLinkCopy}
                    leftIcon={<ActionIcon as={CopyIcon} />}
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
              <Button
                leftIcon={<ActionIcon as={TbArrowUpRight} />}
                onClick={() => unlock(openSend)}
              >
                {t`Send`}
              </Button>
              <Button
                leftIcon={<ActionIcon as={MdDeleteForever} />}
                onClick={() => unlock(openMelt)}
                _hover={{ bg: "red.600" }}
              >
                {t`Melt`}
              </Button>
            </SimpleGrid>
            {nft && (
              <TokenDetails atom={nft} container={container} author={author}>
                <PropertyCard heading={t`Output value`}>
                  <Photons value={txo.value} />
                </PropertyCard>
                {nft.type && (
                  <PropertyCard heading={t`Type`}>
                    <AtomTokenType type={nft.type} />
                  </PropertyCard>
                )}
                <PropertyCard heading={t`Location`}>
                  <div>
                    <Identifier showCopy copyValue={txo.txid}>
                      {location.shortOutput()}
                    </Identifier>
                    <IconButton
                      aria-label={t`Open in block explorer`}
                      icon={<ExternalLinkIcon />}
                      size="xs"
                      variant="ghost"
                      as={Link}
                      to={createExplorerUrl(location.getTxid())}
                      target="_blank"
                    />
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
              </TokenDetails>
            )}
          </Grid>
        </Container>
      </Grid>
      <SendDigitalObject
        asset={txo}
        disclosure={sendDisclosure}
        onSuccess={(txid) => {
          sendDisclosure.onClose();
          openSuccess(txid);
        }}
      />
      <MeltDigitalObject
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
