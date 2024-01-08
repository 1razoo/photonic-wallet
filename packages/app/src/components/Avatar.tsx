import { Avatar as AvatarCUI } from "@chakra-ui/react";
import mime from "mime";
import { AtomNft } from "@app/types";

export default function Avatar({ nft }: { nft: AtomNft }) {
  const { main, file, filename } = nft;

  if (main && main === filename) {
    const type = mime.getType(main);

    // Image file
    if (
      file &&
      [".jpg", ".png", ".gif", ".webp", ".svg"].includes(
        main.substring(main.lastIndexOf("."))
      )
    ) {
      return (
        <AvatarCUI
          src={`data:${type};base64, ${btoa(
            String.fromCharCode(...new Uint8Array(file))
          )}`}
        />
      );
    }
  }
  return null;
}
