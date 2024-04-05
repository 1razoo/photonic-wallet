import { bytesToHex } from "@noble/hashes/utils";
import { ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";
import {
  Image,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Text,
  Flex,
  SimpleGrid,
  Tooltip,
  Divider,
  IconButton,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { filesize } from "filesize";
import mime from "mime";
import AtomData from "./AtomData";
import Identicon from "./Identicon";
import Identifier from "./Identifier";
import { PropertyCard } from "./ViewDigitalObject";
import { Atom } from "@app/types";
import Outpoint from "@lib/Outpoint";
import createExplorerUrl from "@app/network/createExplorerUrl";
import { Link } from "react-router-dom";
import { PropsWithChildren } from "react";

export default function TokenDetails({
  atom,
  author,
  container,
  children,
}: PropsWithChildren<{
  atom: Atom;
  author?: Atom;
  container?: Atom;
}>) {
  const ref = Outpoint.fromString(atom.ref);
  const revealRef =
    atom.revealOutpoint && Outpoint.fromString(atom.revealOutpoint);
  const authorRef = atom.author && Outpoint.fromString(atom.author);
  const containerRef = atom.container && Outpoint.fromString(atom.container);
  const hasAttrs = atom.attrs && Object.keys(atom.attrs).length > 0;
  const isIPFS = atom.fileSrc?.startsWith("ipfs://");

  return (
    <div>
      <Tabs>
        <TabList>
          <Tab>{t`Details`}</Tab>
          <Tab>{t`Inspect`}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            {atom.description && (
              <PropertyCard heading={t`Description`} mb={4}>
                {atom.description}
              </PropertyCard>
            )}
            <PropertyCard heading={t`Atomical ID`} mb={4}>
              <div>
                <Identicon
                  value={ref.refHash()}
                  width="24px"
                  height="24px"
                  sx={{ svg: { height: "26px" } }}
                  float="left"
                />
                <Identifier showCopy copyValue={ref.ref()}>
                  {ref.ref("i")}
                </Identifier>
                <IconButton
                  aria-label={t`Open in block explorer`}
                  icon={<ExternalLinkIcon />}
                  size="xs"
                  variant="ghost"
                  as={Link}
                  to={createExplorerUrl(ref.getTxid())}
                  target="_blank"
                />
              </div>
            </PropertyCard>
            {revealRef && (
              <PropertyCard heading={t`Mint`} mb={4}>
                <div>
                  <Identifier showCopy copyValue={revealRef.ref()}>
                    {revealRef.ref("i")}
                  </Identifier>
                  <IconButton
                    aria-label={t`Open in block explorer`}
                    icon={<ExternalLinkIcon />}
                    size="xs"
                    variant="ghost"
                    as={Link}
                    to={createExplorerUrl(ref.getTxid())}
                    target="_blank"
                  />
                </div>
              </PropertyCard>
            )}
            {authorRef && (
              <PropertyCard heading={t`Author`} mb={4}>
                <Flex justifyContent="space-between" alignItems="center">
                  {author?.name ? (
                    <Text>{author.name}</Text>
                  ) : (
                    <Text fontStyle="italic">&lt;Unnamed author&gt;</Text>
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
              <PropertyCard heading={t`Container`} mb={4}>
                <Flex justifyContent="space-between" alignItems="center">
                  {container?.name ? (
                    <Text>{container.name}</Text>
                  ) : (
                    <Text fontStyle="italic">&lt;Unnamed container&gt;</Text>
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
                      {atom.fileSrc?.replace("ipfs://", "")}
                    </Identifier>
                  </div>
                </PropertyCard>
              )}
              {atom.hashstamp && (
                <PropertyCard
                  heading={t`HashStamp`}
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
                        String.fromCharCode(...new Uint8Array(atom.hashstamp))
                      )}`}
                      width="64px"
                      height="64px"
                      objectFit="contain"
                      backgroundColor="white"
                    />
                    {atom.hash && (
                      <div>
                        <Identifier>
                          {bytesToHex(new Uint8Array(atom.hash))}
                        </Identifier>
                      </div>
                    )}
                  </Flex>
                </PropertyCard>
              )}
              {atom.file && atom.fileSrc && (
                <>
                  <PropertyCard heading={t`Content length`}>
                    {filesize(atom.file.byteLength) as string}
                  </PropertyCard>
                  <PropertyCard heading={t`Content type`}>
                    {mime.getType(atom.fileSrc)}
                  </PropertyCard>
                </>
              )}
              {children}
            </SimpleGrid>
            {hasAttrs && (
              <>
                <Divider my={4} />
                <SimpleGrid columns={[1, 2]} spacing={4} gridAutoRows="1fr">
                  {Object.entries(atom.attrs).map(([k, v]) => (
                    <PropertyCard heading={k} key={k}>
                      {v}
                    </PropertyCard>
                  ))}
                </SimpleGrid>
              </>
            )}
          </TabPanel>
          <TabPanel px={0}>
            <AtomData atom={atom} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
