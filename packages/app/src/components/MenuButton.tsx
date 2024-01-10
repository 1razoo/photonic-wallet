import { PropsWithChildren } from "react";
import { Button, ButtonProps } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import gradient from "/gradient.svg";
import { openMenu } from "@app/signals";

export default function MenuButton({
  to,
  match,
  children,
  ...rest
}: PropsWithChildren<
  { to?: string; match?: string | string[] } & ButtonProps
>) {
  const { pathname } = useLocation();

  const matched = () => {
    if (!match) return false;
    return (Array.isArray(match) ? match : [match]).some((m) =>
      pathname.startsWith(m)
    );
  };

  const active = match ? matched() : pathname === to;
  return (
    <Button
      variant="ghost"
      borderRadius={0}
      justifyContent="left"
      as={Link}
      to={to}
      p={6}
      color={active ? undefined : "whiteAlpha.700"}
      bgImage={active ? `url(${gradient})` : undefined}
      bgPosition="center center"
      bgSize="cover"
      bgRepeat="no-repeat"
      sx={{
        _hover: {
          bg: active ? undefined : "whiteAlpha.100",
        },
        _active: {
          bg: active ? undefined : "whiteAlpha.100",
        },
      }}
      onClick={() => {
        openMenu.value = false;
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}
