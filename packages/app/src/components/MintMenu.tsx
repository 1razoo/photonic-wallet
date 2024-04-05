import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Icon,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import {
  TbTriangleSquareCircle,
  TbCircles,
  TbBox,
  TbUserCircle,
} from "react-icons/tb";
import { NavLink } from "react-router-dom";

export default function MintMenu() {
  return (
    <Menu placement="bottom-end">
      <MenuButton
        variant="primary"
        as={Button}
        rightIcon={<ChevronDownIcon />}
        shadow="dark-md"
      >
        {t`Mint`}
      </MenuButton>
      <MenuList>
        <MenuItem
          as={NavLink}
          to="/mint/object"
          icon={<Icon as={TbTriangleSquareCircle} fontSize="2xl" />}
        >
          {t`Digital Object`}
        </MenuItem>
        <MenuItem
          as={NavLink}
          to="/mint/fungible"
          icon={<Icon as={TbCircles} fontSize="2xl" />}
        >
          {t`Fungible Token`}
        </MenuItem>
        <MenuItem
          as={NavLink}
          to="/mint/container"
          icon={<Icon as={TbBox} fontSize="2xl" />}
        >
          {t`Container`}
        </MenuItem>
        <MenuItem
          as={NavLink}
          to="/mint/user"
          icon={<Icon as={TbUserCircle} fontSize="2xl" />}
        >
          {t`User`}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
