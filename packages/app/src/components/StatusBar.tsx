import { Icon, Spinner, useToast } from "@chakra-ui/react";
import { useState } from "react";
import MenuButton from "./MenuButton";
import { LockIcon, SettingsIcon, UnlockIcon } from "@chakra-ui/icons";
import {
  TbPlug as ConnectedIcon,
  TbPlugOff as DisconnectedIcon,
} from "react-icons/tb";
import { useElectrumManager } from "@app/electrum/useElectrum";
import { electrumStatus, wallet, openModal } from "@app/signals";
import { ElectrumStatus } from "@app/types";

const UnlockButton = () => {
  const toast = useToast();
  const [hover, setHover] = useState(false);

  const unlockWallet = async () => {
    openModal.value = { modal: "unlock" };
  };

  const lockWallet = () => {
    wallet.value = { ...wallet.value, locked: true, wif: undefined };
    toast({
      title: "Wallet locked",
      status: "success",
    });
  };

  if (wallet.value.locked) {
    return (
      <MenuButton
        leftIcon={hover ? <UnlockIcon boxSize={4} /> : <LockIcon boxSize={4} />}
        onClick={() => unlockWallet()}
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
      >
        {hover ? "Click to unlock" : "Locked"}
      </MenuButton>
    );
  }

  return (
    <MenuButton
      leftIcon={hover ? <LockIcon boxSize={4} /> : <UnlockIcon boxSize={4} />}
      onClick={() => {
        lockWallet();
        setHover(false);
      }}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
    >
      {hover ? "Click to lock" : "Unlocked"}
    </MenuButton>
  );
};

const ConnectButton = () => {
  const [hover, setHover] = useState(false);

  const toast = useToast();

  const statusText = {
    [ElectrumStatus.CONNECTED]: "Connected",
    [ElectrumStatus.CONNECTING]: "Connecting",
    [ElectrumStatus.DISCONNECTED]: "Disconnected",
    [ElectrumStatus.LOADING]: "Disconnected",
  };

  const electrum = useElectrumManager();

  const onClickConnect = () => {
    if (!electrum.reconnect()) {
      toast({
        title: "No servers defined",
        status: "error",
      });
    }
  };

  if (electrumStatus.value === ElectrumStatus.CONNECTED) {
    return (
      <MenuButton
        leftIcon={
          <Icon as={hover ? DisconnectedIcon : ConnectedIcon} boxSize={4} />
        }
        onClick={() => {
          electrum.disconnect("user");
          setHover(false);
        }}
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
      >
        {hover ? "Click to disconnect" : statusText[electrumStatus.value]}
      </MenuButton>
    );
  }

  if (electrumStatus.value === ElectrumStatus.CONNECTING) {
    return (
      <MenuButton leftIcon={<Spinner size="sm" />}>
        {statusText[electrumStatus.value]}
      </MenuButton>
    );
  }

  return (
    <MenuButton
      leftIcon={
        <Icon as={hover ? ConnectedIcon : DisconnectedIcon} boxSize={4} />
      }
      onClick={() => {
        onClickConnect();
        setHover(false);
      }}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
    >
      {hover ? "Click to connect" : statusText[electrumStatus.value]}
    </MenuButton>
  );
};

export default function StatusBar() {
  return (
    <>
      <ConnectButton />
      <UnlockButton />
      <MenuButton
        to="/settings/wallet"
        leftIcon={<SettingsIcon boxSize={4} />}
        match="/settings"
      >
        Settings
      </MenuButton>
    </>
  );
}
