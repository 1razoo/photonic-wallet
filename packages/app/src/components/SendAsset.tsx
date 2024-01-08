import { useEffect, useRef, useState } from "react";
import { PrivateKey } from "@radiantblockchain/radiantjs";
import coinSelect from "@lib/coinSelect";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  ModalCloseButton,
  UseDisclosureProps,
  Alert,
  AlertDescription,
  AlertIcon,
} from "@chakra-ui/react";
import { photonsToRXD } from "@lib/format";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import { ContractType, TxO } from "@app/types";
import { p2pkhScript, nftScript } from "@lib/script";
import { buildTx } from "@lib/tx";
import Identifier from "./Identifier";
import Outpoint from "@lib/Outpoint";
import useElectrum from "@app/electrum/useElectrum";
import { network, wallet } from "@app/signals";

interface Props {
  asset: TxO;
  onSuccess?: (txid: string) => void;
  disclosure: UseDisclosureProps;
}

export default function SendAsset({ asset, onSuccess, disclosure }: Props) {
  const client = useElectrum();
  const { isOpen, onClose } = disclosure;
  const toAddress = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const ref = Outpoint.fromString(asset.script.substring(2, 74));

  const rxd = useLiveQuery(
    () => db.txo.where({ contractType: ContractType.RXD, spent: 0 }).toArray(),
    [],
    []
  );

  useEffect(() => {
    setSuccess(true);
    setLoading(false);
  }, [isOpen]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(true);
    setLoading(true);

    let fail = false;
    if (!toAddress.current?.value) {
      // FIXME validate address
      fail = true;
      setErrorMessage("Invalid address");
    }

    if (fail) {
      setSuccess(false);
      setLoading(false);
      return;
    }

    const required = { ...asset, required: true };
    const coins: (TxO & { required?: boolean })[] = [required, ...rxd.slice()];

    const changeScript = p2pkhScript(wallet.value.address);
    const script = nftScript(
      toAddress.current?.value as string,
      ref.reverse().ref()
    );

    const selected = coinSelect(
      wallet.value.address,
      coins,
      [{ script, value: asset.value }],
      changeScript,
      2000
    );
    // FIXME errors here sometimes
    if (!selected.inputs?.length) {
      setErrorMessage("Insufficient funds");
      setSuccess(false);
      setLoading(false);
      return;
    }

    selected.inputs[0].script = asset.script;

    const privKey = PrivateKey.fromString(wallet.value.wif as string);
    console.log(selected);

    const rawTx = buildTx(
      wallet.value.address,
      privKey.toString(),
      selected.inputs,
      selected.outputs,
      false
    ).toString();
    try {
      const txid = (await client?.request(
        "blockchain.transaction.broadcast",
        rawTx
      )) as string;
      onSuccess && onSuccess(txid);
    } catch (error) {
      setErrorMessage("Transaction rejected");
      setSuccess(false);
      setLoading(false);
    }
  };

  if (!isOpen || !onClose) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={toAddress}
      isCentered
    >
      <form onSubmit={submit}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Asset</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} gap={4}>
            {success || (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <FormControl>
              <FormLabel>To</FormLabel>
              <Input
                ref={toAddress}
                type="text"
                placeholder={`${network.value.name} address`}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Asset</FormLabel>
              <Identifier>{ref.reverse().atom()}</Identifier>
            </FormControl>
            <FormControl>
              <FormLabel>Amount</FormLabel>
              <Identifier>{`${photonsToRXD(asset.value)} ${
                network.value.ticker
              }`}</Identifier>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" variant="primary" isLoading={loading} mr={4}>
              Send
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
}
