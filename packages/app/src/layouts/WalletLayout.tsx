import { PropsWithChildren, useEffect, useState } from "react";
import { MdHome } from "react-icons/md";
import { Navigate, Outlet } from "react-router-dom";
import { Box, Icon } from "@chakra-ui/react";
import {
  TbCircles,
  TbCoins,
  TbTools,
  TbTriangleSquareCircle,
} from "react-icons/tb";
import { RepeatClockIcon } from "@chakra-ui/icons";
import SideBar from "@app/components/SideBar";
import MenuButton from "@app/components/MenuButton";
import { openMenu, wallet } from "@app/signals";
import { effect } from "@preact/signals-react";

function DeviceSelect({ children }: PropsWithChildren) {
  const [display, setDisplay] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(
    () =>
      effect(() => {
        if (openMenu.value) {
          setDisplay(true);
          requestAnimationFrame(() => setIsOpen(true));
        } else {
          setIsOpen(false);
        }
      }),
    []
  );

  return (
    <Box
      position={{ base: "sticky", lg: "static" }}
      zIndex={20}
      opacity={{ base: isOpen ? 1 : 0, lg: 1 }}
      display={{ base: display ? "block" : "none", lg: "block" }}
      transition={{ base: "opacity 0.2s", lg: "none" }}
      onTransitionEnd={(event) =>
        event.propertyName === "opacity" && !isOpen && setDisplay(false)
      }
    >
      {children}
    </Box>
  );
}

export default function WalletLayout() {
  if (!wallet.value.ready) return null;

  if (!wallet.value.exists) {
    console.debug("No wallet found");
    return <Navigate to="/create-wallet" />;
  }

  return (
    <>
      <DeviceSelect>
        <SideBar>
          <MenuButton
            display={{ base: "inline-flex", lg: "none" }}
            to="/home"
            leftIcon={<Icon as={MdHome} boxSize={4} />}
          >
            Home
          </MenuButton>
          <MenuButton
            to="/objects"
            match="/objects"
            leftIcon={<Icon as={TbTriangleSquareCircle} boxSize={4} />}
          >
            Digital Objects
          </MenuButton>
          <MenuButton
            to="/fungible"
            leftIcon={<Icon as={TbCircles} boxSize={4} />}
          >
            Fungible Tokens
          </MenuButton>
          <MenuButton to="/coins" leftIcon={<Icon as={TbCoins} boxSize={4} />}>
            Coins
          </MenuButton>
          <MenuButton to="/history" leftIcon={<RepeatClockIcon boxSize={4} />}>
            History
          </MenuButton>
          <MenuButton
            display={{ base: "none", md: "inline-flex" }}
            to="/create"
            match={["/create", "/mint"]}
            leftIcon={<Icon as={TbTools} boxSize={4} />}
          >
            Create
          </MenuButton>
        </SideBar>
      </DeviceSelect>
      <Outlet />
    </>
  );
}
