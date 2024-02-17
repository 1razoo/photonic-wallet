import { useEffect, useRef, useState } from "react";
import { t } from "@lingui/macro";
import { PrivateKey } from "@radiantblockchain/radiantjs";
import Big from "big.js";
import coinSelect, { SelectableInput } from "@lib/coinSelect";
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
  InputGroup,
  InputRightAddon,
  Box,
  Heading,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { photonsToRXD } from "@lib/format";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import { ContractType, TxO } from "@app/types";
import { p2pkhScript } from "@lib/script";
import { buildTx } from "@lib/tx";
import useElectrum from "@app/electrum/useElectrum";
import { feeRate, network, totalBalance, wallet } from "@app/signals";

interface Props {
  onSuccess?: (txid: string) => void;
  disclosure: UseDisclosureProps;
}

export default function SendRXD({ onSuccess, disclosure }: Props) {
  const client = useElectrum();
  const { isOpen, onClose } = disclosure;
  const amount = useRef<HTMLInputElement>(null);
  const toAddress = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const toast = useToast();

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
    if (!amount.current?.value) {
      fail = true;
      setErrorMessage(t`Invalid amount`);
    }

    if (!toAddress.current?.value) {
      fail = true;
      setErrorMessage(t`Invalid address`);
    }

    if (fail) {
      setSuccess(false);
      setLoading(false);
      return;
    }

    const value = Big(amount.current?.value || 0)
      .times(100000000)
      .toNumber();

    const coins: SelectableInput[] = rxd.slice();
    try {
      const changeScript = p2pkhScript(wallet.value.address);
      const script = p2pkhScript(toAddress.current?.value as string);

      if (!script) {
        setErrorMessage(t`Invalid address`);
        setSuccess(false);
        setLoading(false);
        return;
      }

      const selected = coinSelect(
        wallet.value.address,
        coins,
        [{ script, value }],
        changeScript,
        feeRate.value
      );

      if (!selected.inputs?.length) {
        setErrorMessage(t`Insufficient funds`);
        setSuccess(false);
        setLoading(false);
        return;
      }

      const privKey = PrivateKey.fromString(wallet.value.wif as string);

      const rawTx = buildTx(
        wallet.value.address,
        privKey.toString(),
        selected.inputs,
        selected.outputs,
        false
      ).toString();
      console.debug("Broadcasting", rawTx);
      const txid = (await client?.request(
        "blockchain.transaction.broadcast",
        rawTx
      )) as string;
      console.debug("Result", txid);
      toast({
        title: t`${photonsToRXD(value)} ${network.value.ticker} sent!`,
        status: "success",
      });

      onSuccess && onSuccess(txid);
    } catch (error) {
      setErrorMessage(t`Could not send transaction`);
      console.error(error);
      setSuccess(false);
      setLoading(false);
    }
  };

  if (!isOpen || !onClose) return null;

  return (
    <Modal
      closeOnOverlayClick
      isOpen={isOpen}
      onClose={onClose}
      initialFocusRef={toAddress}
      isCentered
    >
      <form onSubmit={submit}>
        <ModalOverlay />
        <ModalContent m={4}>
          <ModalHeader>Send {network.value.ticker}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} gap={4}>
            <VStack>
              <Heading size="sm">{t`Balance`}</Heading>
              <Box>
                {photonsToRXD(totalBalance.value)} {network.value.ticker}
              </Box>
            </VStack>
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
              <FormLabel>{t`Amount`}</FormLabel>
              <InputGroup>
                <Input
                  ref={amount}
                  type="number"
                  step="0.00000001"
                  placeholder="0"
                />
                <InputRightAddon
                  children={network.value.ticker}
                  userSelect="none"
                />
              </InputGroup>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" variant="primary" isLoading={loading} mr={4}>
              {t`Send`}
            </Button>
            <Button onClick={onClose}>{t`Cancel`}</Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
}
