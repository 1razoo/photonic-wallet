import { Box, Icon, Image } from "@chakra-ui/react";
import mime from "mime";
import { QRCodeSVG } from "qrcode.react";
import { AtomNft } from "@app/types";
import { TbLink } from "react-icons/tb";
import {
  BsFileEarmarkFill,
  BsFillFileTextFill,
  BsFillFileImageFill,
  BsFillFileXFill,
} from "react-icons/bs";
import Identifier from "./Identifier";
import useIpfsUrl from "@app/hooks/useIpfsUrl";
import { t } from "@lingui/macro";
import UnsafeImage from "./UnsafeImage";

const ContentMessage = ({ message = "No content" }: { message?: string }) => (
  <Box
    bg="blackAlpha.400"
    p={4}
    fontSize="md"
    mx={4}
    textAlign="center"
    fontWeight="bold"
    color="gray.200"
    userSelect="none"
  >
    {message}
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
  const type = filename && mime.getType(filename);
  const isImage = type?.startsWith("image/");

  if (isImage && main) {
    const isIpfs = main?.match(/^ipfs:\/\//);
    const url = isIpfs ? useIpfsUrl(main) : main;
    if (isIpfs) {
      return (
        <Image
          src={url}
          width="100%"
          height="100%"
          objectFit="contain"
          //sx={{ imageRendering: "pixelated" }}
          backgroundColor="black"
        />
      );
    } else {
      if (thumbnail) {
        return (
          <Icon as={BsFillFileImageFill} fontSize="9xl" color="gray.500" />
        );
      } else {
        return <UnsafeImage src={url} />;
      }
    }
  }

  // Non-image URL
  if (main) {
    if (thumbnail) {
      return <Icon as={TbLink} fontSize="9xl" color="gray.500" />;
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

  if (filename && file) {
    // Text file
    if (type?.startsWith("text/plain")) {
      const text = new TextDecoder("utf-8").decode(file);
      if (thumbnail) {
        return <Icon as={BsFillFileTextFill} fontSize="9xl" color="gray.500" />;
      }

      return (
        <Box as="pre" whiteSpace="pre-wrap">
          {text.substring(0, maxLen)}
          {text.length > maxLen && "..."}
        </Box>
      );
    }

    // Image file
    if (file && type?.startsWith("image/")) {
      return (
        <Image
          src={`data:${type};base64, ${btoa(
            String.fromCharCode(...new Uint8Array(file))
          )}`}
          width="100%"
          height="100%"
          objectFit="contain"
          //sx={{ imageRendering: "pixelated" }} // TODO find a way to apply this to pixel art
          backgroundColor="white"
        />
      );
    }

    // Unknown file
    if (thumbnail) {
      return <Icon as={BsFileEarmarkFill} fontSize="9xl" color="gray.500" />;
    }

    return (
      <>
        <Icon as={BsFileEarmarkFill} fontSize="9xl" color="gray.500" mb={2} />
        <ContentMessage message={filename} />
      </>
    );
  }

  if (thumbnail) {
    return <Icon as={BsFillFileXFill} fontSize="9xl" color="gray.500" />;
  }

  return (
    <>
      <Icon as={BsFillFileXFill} fontSize="9xl" color="gray.500" mb={2} />
      <ContentMessage />
    </>
  );
}
