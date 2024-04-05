import { useEffect, useRef, useState } from "react";
import { t } from "@lingui/macro";
import { PrivateKey } from "@radiantblockchain/radiantjs";
import coinSelect, { SelectableInput, accumulateInputs } from "@lib/coinSelect";
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
import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import { Atom, ContractType } from "@app/types";
import { ftScript, p2pkhScript } from "@lib/script";
import { buildTx } from "@lib/tx";
import useElectrum from "@app/electrum/useElectrum";
import { feeRate, ftBalance, network, wallet } from "@app/signals";
import { reverseRef } from "@lib/Outpoint";
import TokenContent from "./TokenContent";
import { RiQuestionFill } from "react-icons/ri";

interface Props {
  atom: Atom;
  onSuccess?: (txid: string) => void;
  disclosure: UseDisclosureProps;
}

export default function SendFungible({ atom, onSuccess, disclosure }: Props) {
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

  const setFailure = (reason: string) => {
    setErrorMessage(reason);
    setSuccess(false);
    setLoading(false);
  };

  useEffect(() => {
    setSuccess(true);
    setLoading(false);
  }, [isOpen]);

  const ticker = (atom.args.ticker as string) || atom.name || "???";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(true);
    setLoading(true);

    if (!amount.current?.value) {
      return setFailure(t`Invalid amount`);
    }

    if (!toAddress.current?.value) {
      return setFailure(t`Invalid address`);
    }

    const value = parseInt(amount.current?.value, 10);
    const refLE = reverseRef(atom.ref);
    const fromScript = ftScript(wallet.value.address, refLE);
    const tokens = await db.txo
      .where({ script: fromScript, spent: 0 })
      .toArray();

    const coins: SelectableInput[] = rxd.slice();
    try {
      const changeScript = p2pkhScript(wallet.value.address);
      const toScript = ftScript(toAddress.current?.value as string, refLE);

      if (!toScript) {
        return setFailure(t`Invalid address`);
      }

      const accum = accumulateInputs(tokens, value);

      if (accum.sum < value) {
        return setFailure(t`Insufficient token balance`);
      }

      const outputs = [{ script: toScript, value }];
      if (accum.sum > value) {
        outputs.push({ script: fromScript, value: accum.sum - value });
      }

      const selected = coinSelect(
        wallet.value.address,
        // FIXME check script is using scriptSig not scriptPubKey
        [...accum.inputs, ...coins],
        outputs,
        changeScript,
        feeRate.value
      );

      if (!selected.inputs?.length) {
        return setFailure(t`Insufficient funds`);
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
        title: t`Sent ${value} ${ticker}`,
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
        <ModalContent>
          <ModalHeader>{t`Send ${atom.name || ticker}`}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} gap={4}>
            <VStack>
              <Box w="48px" h="48px">
                <TokenContent
                  atom={atom}
                  defaultIcon={RiQuestionFill}
                  thumbnail
                />
              </Box>
              <Heading size="sm">{t`Balance`}</Heading>
              <Box>
                {ftBalance.value[atom.ref]?.confirmed +
                  ftBalance.value[atom.ref]?.unconfirmed}{" "}
                {ticker}
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
                <Input ref={amount} type="number" placeholder="0" />
                <InputRightAddon children={ticker} userSelect="none" />
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
