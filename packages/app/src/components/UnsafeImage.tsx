import { Button, Image } from "@chakra-ui/react";
import Identifier from "./Identifier";
import { useState } from "react";

export default function UnsafeImage({ src }: { src: string }) {
  const [show, setShow] = useState(false);
  if (show) {
    return (
      <Image
        src={src}
        width="100%"
        height="100%"
        objectFit="contain"
        //sx={{ imageRendering: "pixelated" }}
        backgroundColor="black"
      />
    );
  }
  return (
    <>
      <Identifier>{src}</Identifier>
      <Button mt={4} onClick={() => setShow(true)}>
        Show image
      </Button>
    </>
  );
}
