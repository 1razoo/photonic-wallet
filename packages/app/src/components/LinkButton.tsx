import { Link, LinkProps } from "react-router-dom";
import { Button, ButtonProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function LinkButton({
  children,
  ...rest
}: PropsWithChildren<ButtonProps & LinkProps>) {
  return (
    <Button as={Link} {...rest}>
      {children}
    </Button>
  );
}
