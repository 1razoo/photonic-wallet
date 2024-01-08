import { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  ModalCloseButton,
  UseDisclosureProps,
  useToast,
  Flex,
  Alert,
  AlertDescription,
  AlertIcon,
} from "@chakra-ui/react";
import { ContractType, TxO } from "@app/types";
import useElectrum from "@app/electrum/useElectrum";
import { WarningIcon } from "@chakra-ui/icons";
import coinSelect from "@lib/coinSelect";
import { p2pkhScript } from "@lib/script";
import { buildTx } from "@lib/tx";
import { PrivateKey } from "@radiantblockchain/radiantjs";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../db";
import { wallet } from "@app/signals";

interface Props {
  asset: TxO;
  onSuccess?: (txid: string) => void;
  disclosure: UseDisclosureProps;
}

export default function MeltAsset({ asset, onSuccess, disclosure }: Props) {
  const client = useElectrum();
  const { isOpen, onClose } = disclosure;
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

  if (!isOpen || !onClose) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(true);
    setLoading(true);

    const required = { ...asset, required: true };
    const coins: (TxO & { required?: boolean })[] = [required, ...rxd.slice()];

    const changeScript = p2pkhScript(wallet.value.address);

    const selected = coinSelect(
      wallet.value.address,
      coins,
      [],
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
      toast({ status: "success", title: "Token melted" });
    } catch (error) {
      setErrorMessage("Transaction rejected");
      setSuccess(false);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <form onSubmit={submit}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Melt token</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} gap={4} as={Flex} flexDirection="row">
            {success || (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <WarningIcon fontSize="2xl" />
            This will destroy your token! Are you sure?
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              bgColor="red.600"
              _hover={{ bg: "red.500" }}
              isLoading={loading}
              mr={4}
            >
              Melt
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </form>
    </Modal>
  );
}
