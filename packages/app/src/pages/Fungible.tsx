import { useParams } from "react-router-dom";
import { t } from "@lingui/macro";
import { Flex } from "@chakra-ui/react";
import PageHeader from "@app/components/PageHeader";
import { Atom } from "@app/types";
import { ftBalance } from "@app/signals";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@app/db";
import TokenRow from "@app/components/TokenRow";
import ViewPanelLayout from "@app/layouts/ViewPanelLayout";
import { RiQuestionFill } from "react-icons/ri";
import ViewFungible from "@app/components/ViewFungible";
import NoContent from "@app/components/NoContent";
import MintMenu from "@app/components/MintMenu";

export default function Fungible() {
  const { sref } = useParams();

  return (
    <ViewPanelLayout>
      <TokenGrid />
      {sref && <ViewFungible sref={sref} context="/fungible" />}
    </ViewPanelLayout>
  );
}

function TokenGrid() {
  const atoms = useLiveQuery(
    () => db.atom.where("ref").anyOf(Object.keys(ftBalance.value)).toArray(),
    [ftBalance.value]
  );

  const getBalance = (atom: Atom) => {
    if (!ftBalance.value[atom.ref]) return 0;
    return (
      ftBalance.value[atom.ref].unconfirmed +
      ftBalance.value[atom.ref].confirmed
    );
  };

  if (!atoms) {
    return null;
  }

  return (
    <>
      <PageHeader toolbar={<MintMenu />}>{t`Fungible Tokens`}</PageHeader>
      <Flex direction="column" pb={4} px={4} gap={4}>
        {atoms.length === 0 ? (
          <NoContent>{t`No assets`}</NoContent>
        ) : (
          atoms.map(
            (token) =>
              token && (
                <TokenRow
                  atom={token}
                  value={getBalance(token)}
                  key={token.ref}
                  to={`/fungible/atom/${token.ref}`}
                  size="sm"
                  defaultIcon={RiQuestionFill}
                />
              )
          )
        )}
      </Flex>
    </>
  );
}
