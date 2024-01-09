import { useState, FocusEvent } from "react";
import {
  Box,
  Container,
  Divider,
  Editable,
  EditableInput,
  EditablePreview,
  IconButton,
  Input,
  VStack,
  useEditableControls,
} from "@chakra-ui/react";
import {
  AddIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DeleteIcon,
  EditIcon,
} from "@chakra-ui/icons";
import { useLiveQuery } from "dexie-react-hooks";
import { t } from "@lingui/macro";
import db from "@app/db";
import { PromiseExtended } from "dexie";
import Card from "@app/components/Card";
import { wallet } from "@app/signals";

function NewControls() {
  const { getEditButtonProps } = useEditableControls();

  return (
    <IconButton
      icon={<AddIcon />}
      aria-label={t`New`}
      size="sm"
      {...getEditButtonProps()}
    />
  );
}

function EditableControls() {
  const { getEditButtonProps } = useEditableControls();

  return (
    <IconButton
      icon={<EditIcon />}
      aria-label={t`Edit`}
      size="sm"
      {...getEditButtonProps()}
    />
  );
}

// type Server = string;

export default function Servers() {
  const allServers = useLiveQuery(
    () =>
      db.kvp.get("servers") as PromiseExtended<{
        mainnet: string[];
        testnet: string[];
      }>,
    [],
    { mainnet: [], testnet: [] }
  );
  const [newKey, setNewKey] = useState(1);

  const servers = allServers[wallet.value.net];

  const newServer = (event: FocusEvent<HTMLInputElement>) => {
    db.kvp.put(
      {
        ...allServers,
        [wallet.value.net]: [event.target.value, ...servers],
      },
      "servers"
    );

    // Recreate new editable by changing the key
    setNewKey(newKey + 1);
  };

  const removeServer = (index: number) => {
    const spliced = servers.slice();
    spliced.splice(index, 1);
    db.kvp.put({ ...allServers, [wallet.value.net]: spliced }, "servers");
  };

  const moveServer = (index: number, up: boolean) => {
    const spliced = servers.slice();
    spliced[index] = spliced.splice(
      index + (up ? -1 : 1),
      1,
      spliced[index]
    )[0];
    db.kvp.put({ ...allServers, [wallet.value.net]: spliced }, "servers");
  };

  const editServer = (index: number, value: string) => {
    const edited = servers.slice();
    edited[index] = value;
    db.kvp.put({ ...allServers, [wallet.value.net]: edited }, "servers");
  };

  return (
    <Container maxW="container.md" px={4}>
      <Card>
        <VStack spacing={2} align="stretch" divider={<Divider />}>
          <Box key="new" display="flex" alignItems="center" gap={2}>
            <Editable
              key={`new-${newKey}`}
              defaultValue=""
              flexGrow={1}
              display="flex"
              gap={4}
              alignItems="center"
              height={10}
            >
              <NewControls />
              <EditablePreview py={2} />
              <Input
                as={EditableInput}
                flexGrow={1}
                width="auto"
                onBlur={newServer}
              />
            </Editable>
          </Box>
          {servers.map((server, index) => (
            <Box
              key={`${server}-${index}`}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Editable
                defaultValue={server}
                flexGrow={1}
                display="flex"
                gap={4}
                alignItems="center"
                height={10}
                onSubmit={(value) => editServer(index, value)}
              >
                <EditableControls />
                <EditablePreview />
                <Input as={EditableInput} flexGrow={1} width="auto" />
              </Editable>
              <IconButton
                icon={<ArrowUpIcon />}
                aria-label={t`Move up`}
                size="sm"
                onClick={() => moveServer(index, true)}
                isDisabled={index === 0}
              />
              <IconButton
                icon={<ArrowDownIcon />}
                aria-label={t`Move down`}
                size="sm"
                onClick={() => moveServer(index, false)}
                isDisabled={index + 1 === servers.length}
              />
              <IconButton
                icon={<DeleteIcon />}
                aria-label={t`Delete`}
                size="sm"
                onClick={() => removeServer(index)}
              />
            </Box>
          ))}
        </VStack>
      </Card>
    </Container>
  );
}
