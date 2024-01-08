import { Box, Icon, Image } from "@chakra-ui/react";
import mime from "mime";
import { QRCodeSVG } from "qrcode.react";
import { AtomNft } from "@app/types";
import {
  TbFileSymlink,
  TbFileText,
  TbFileUnknown,
  TbFileX,
  TbLink,
} from "react-icons/tb";
import Identifier from "./Identifier";
import useIpfsUrl from "@app/hooks/useIpfsUrl";

const ContentError = ({ notFound }: { notFound: boolean }) => (
  <Box
    bg="blackAlpha.400"
    p={4}
    fontSize="sm"
    mx={4}
    textAlign="center"
    fontWeight="bold"
    color="gray.200"
    userSelect="none"
  >
    {notFound ? "NO CONTENT" : "UNRECOGNIZED CONTENT"}
  </Box>
);

export default function TokenContent({
  nft,
  thumbnail = false,
}: {
  nft?: AtomNft;
  thumbnail?: boolean;
}) {
  const { main, file, filename } = nft || {};
  const maxLen = 1000;

  const isIPFS = main?.match(/^ipfs:\/\//);
  if (isIPFS) {
    const url = useIpfsUrl(main as string);
    return (
      <Image
        src={url}
        width="100%"
        height="100%"
        objectFit="contain"
        sx={{ imageRendering: "pixelated" }}
        backgroundColor="black"
      />
    );
  }

  // Links or main filename without a file
  const isURL = main?.match(/^http(s)?:\/\//);
  if (isURL || (main && !filename)) {
    if (thumbnail) {
      return (
        <Icon
          as={isURL ? TbLink : TbFileSymlink}
          fontSize="9xl"
          color="gray.500"
        />
      );
    }
    return (
      <>
        {thumbnail || (
          <Box borderRadius="md" overflow="hidden" mb={4}>
            <QRCodeSVG size={256} value={main as string} includeMargin />
          </Box>
        )}
        <div>
          <Identifier copyValue={main} showCopy>
            {(main as string).substring(0, 200)}
            {(main as string).length > 200 && "..."}
          </Identifier>
        </div>
      </>
    );
  }

  if (main && main === filename) {
    const type = mime.getType(main);

    // Text file
    if (type?.startsWith("text/plain")) {
      const text = new TextDecoder("utf-8").decode(file);
      if (thumbnail) {
        return <Icon as={TbFileText} fontSize="9xl" color="gray.500" />;
      }

      return (
        <Box as="pre" whiteSpace="pre-wrap">
          {text.substring(0, maxLen)}
          {text.length > maxLen && "..."}
        </Box>
      );
    }

    // Image file
    if (
      file &&
      [".jpg", ".png", ".gif", ".webp", ".svg"].includes(
        main.substring(main.lastIndexOf("."))
      )
    ) {
      return (
        <Image
          src={`data:${type};base64, ${btoa(
            String.fromCharCode(...new Uint8Array(file))
          )}`}
          width="100%"
          height="100%"
          objectFit="contain"
          sx={{ imageRendering: "pixelated" }}
          backgroundColor="white"
        />
      );
    }

    // Unknown file
    if (thumbnail) {
      return <Icon as={TbFileUnknown} fontSize="9xl" color="gray.500" />;
    }

    return (
      <>
        <Icon as={TbFileUnknown} fontSize="9xl" color="gray.500" mb={2} />
        <ContentError notFound={false} />
      </>
    );
  }

  if (thumbnail) {
    return <Icon as={TbFileX} fontSize="9xl" color="gray.500" />;
  }
  return (
    <>
      <Icon as={TbFileX} fontSize="9xl" color="gray.500" mb={2} />
      <ContentError notFound />
    </>
  );
}
