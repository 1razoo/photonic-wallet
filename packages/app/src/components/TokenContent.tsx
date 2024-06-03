import { Box, Icon, Image } from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { SmartToken } from "@app/types";
import { TbLink } from "react-icons/tb";
import {
  BsFileEarmarkFill,
  BsFillFileTextFill,
  BsFillFileImageFill,
  BsFillFileXFill,
} from "react-icons/bs";
import Identifier from "./Identifier";
import useIpfsUrl from "@app/hooks/useIpfsUrl";
import UnsafeImage from "./UnsafeImage";
import { IconBaseProps, IconType } from "react-icons/lib";

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
  rst,
  thumbnail = false,
  defaultIcon = BsFillFileXFill,
}: {
  rst?: SmartToken;
  thumbnail?: boolean;
  defaultIcon?: ((props: IconBaseProps) => JSX.Element) | IconType;
}) {
  const { embed, remote } = rst || {};
  const maxLen = 1000;

  // Image URL
  if (remote && remote.t?.startsWith("image/")) {
    const isIpfs = remote.src?.match(/^ipfs:\/\//);
    const url = isIpfs ? useIpfsUrl(remote.src) : remote.src;
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
          <Icon
            as={BsFillFileImageFill}
            width="100%"
            height="100%"
            color="gray.500"
          />
        );
      } else {
        return <UnsafeImage src={url} />;
      }
    }
  }

  // Non-image URL
  if (remote) {
    if (thumbnail) {
      return <Icon as={TbLink} width="100%" height="100%" color="gray.500" />;
    }
    return (
      <>
        {thumbnail || (
          <Box borderRadius="md" overflow="hidden" mb={4}>
            <QRCodeSVG size={256} value={remote.src} includeMargin />
          </Box>
        )}
        <div>
          <Identifier copyValue={remote.src} showCopy>
            {remote.src.substring(0, 200)}
            {remote.src.length > 200 && "..."}
          </Identifier>
        </div>
      </>
    );
  }

  if (embed) {
    // Text file
    if (embed.t?.startsWith("text/plain")) {
      if (thumbnail) {
        return (
          <Icon
            as={BsFillFileTextFill}
            width="100%"
            height="100%"
            color="gray.500"
          />
        );
      }

      const text = new TextDecoder("utf-8").decode(embed.b);
      return (
        <Box as="pre" whiteSpace="pre-wrap">
          {text.substring(0, maxLen)}
          {text.length > maxLen && "..."}
        </Box>
      );
    }

    // Image file
    if (embed.t?.startsWith("image/")) {
      return (
        <Image
          src={`data:${embed.t};base64, ${btoa(
            String.fromCharCode(...new Uint8Array(embed.b))
          )}`}
          width="100%"
          height="100%"
          objectFit="contain"
          //sx={{ imageRendering: "pixelated" }} // TODO find a way to apply this to pixel art
          //backgroundColor="white"
        />
      );
    }

    // Unknown file
    if (thumbnail) {
      return (
        <Icon
          as={BsFileEarmarkFill}
          width="100%"
          height="100%"
          color="gray.500"
        />
      );
    }

    return (
      <>
        <Icon
          as={BsFileEarmarkFill}
          width="100%"
          height="100%"
          color="gray.500"
          mb={2}
        />
        <ContentMessage />
      </>
    );
  }

  if (thumbnail) {
    return (
      <Icon as={defaultIcon} width="100%" height="100%" color="gray.500" />
    );
  }

  return (
    <>
      <Icon
        as={defaultIcon}
        width="100%"
        height="100%"
        color="gray.500"
        mb={2}
      />
      <ContentMessage />
    </>
  );
}
