import {
  Alert,
  AlertIcon,
  Box,
  BoxProps,
  Button,
  Container,
  Flex,
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
import { t } from "@lingui/macro";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import { CopyIcon } from "@chakra-ui/icons";
import { PropsWithChildren, ReactNode, useRef } from "react";
import Card from "@app/components/Card";
import ContentContainer from "@app/components/ContentContainer";
import TokenContent from "@app/components/TokenContent";
import PageHeader from "@app/components/PageHeader";
import TxSuccessModal from "./TxSuccessModal";
import { SmartToken } from "../types";
import { openModal, wallet } from "@app/signals";
import {
  RiContractRightLine,
  RiExpandLeftLine,
  RiQuestionFill,
} from "react-icons/ri";
import { useViewPanelContext } from "@app/layouts/ViewPanelLayout";
import TokenDetails from "./TokenDetails";
import ValueTag from "./ValueTag";
import SendFungible from "./SendFungible";
import MeltFungible from "./MeltFungible";
import { TbArrowUpRight } from "react-icons/tb";
import { MdDeleteForever } from "react-icons/md";
import ActionIcon from "./ActionIcon";
import FtBalance from "./FtBalance";

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
      {children}
    </Alert>
  );
}

export default function ViewFungible({
  sref,
  context,
  ...rest
}: {
  sref: string;
  context?: string;
  size?: "sm" | "md";
  toolbar?: React.ReactNode;
} & GridProps) {
  const [collapsed, setCollapsed] = useViewPanelContext();
  const size = collapsed ? "md" : "sm";
  const sendDisclosure = useDisclosure();
  const meltDisclosure = useDisclosure();
  const successDisclosure = useDisclosure();
  const [token, author, container] = useLiveQuery(
    async () => {
      const token = await db.rst.get({ ref: sref });
      const a = token?.author && (await db.rst.get({ ref: token.author }));
      const c =
        token?.container && (await db.rst.get({ ref: token.container }));
      return [token, a, c] as [SmartToken?, SmartToken?, SmartToken?];
    },
    [sref],
    []
  );
  const txid = useRef("");
  const { onCopy: onLinkCopy } = useClipboard(token?.remote?.src || "");

  // TODO show loading or 404
  if (!token) {
    return (
      <ContentContainer>
        <PageHeader />
      </ContentContainer>
    );
  }

  const unlock = (fn: () => void) => {
    if (wallet.value.locked) {
      openModal.value = {
        modal: "unlock",
        onClose: (success) => success && fn(),
      };
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

  const isIPFS = token.remote?.src?.startsWith("ipfs://");
  const isKnownEmbed = [
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/svg+xml",
  ].includes(token.embed?.t || "");

  return (
    <>
      <Grid gridTemplateRows="auto 1fr" height="100vh" {...rest}>
        <PageHeader
          close
          to={context}
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
          {token.name || t`Unnamed token`}
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
                alignItems="left"
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
                <Flex alignItems="center">
                  {token && (
                    <Box w="64px" h="64px">
                      <TokenContent
                        rst={token}
                        defaultIcon={RiQuestionFill}
                        thumbnail
                      />
                    </Box>
                  )}
                  <Box ml={4} flexGrow={1}>
                    <Heading size="md">{token.name}</Heading>
                    <Heading size="md" fontWeight="normal" color="gray.400">
                      {(token.ticker as string) || <i>No ticker</i>}
                    </Heading>
                  </Box>
                  <ValueTag>
                    <FtBalance id={sref} />
                  </ValueTag>
                </Flex>
              </GridItem>
              {token.embed && !isKnownEmbed && (
                <Warning>{t`Files may be unsafe and result in loss of funds`}</Warning>
              )}
              {!token.embed && token.remote && !isIPFS && (
                <Warning>
                  {t`URLs may be unsafe and result in loss of funds`}
                </Warning>
              )}
              {!token.embed && token.remote && (
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
            <TokenDetails rst={token} container={container} author={author} />
          </Grid>
        </Container>
      </Grid>
      <SendFungible
        rst={token}
        disclosure={sendDisclosure}
        onSuccess={(txid) => {
          sendDisclosure.onClose();
          openSuccess(txid);
        }}
      />
      <MeltFungible
        rst={token}
        disclosure={meltDisclosure}
        onSuccess={(txid: string) => {
          meltDisclosure.onClose();
          openSuccess(txid);
        }}
      />
      <TxSuccessModal
        onClose={() => {
          successDisclosure.onClose();
        }}
        isOpen={successDisclosure.isOpen}
        txid={txid.current}
      />
    </>
  );
}
