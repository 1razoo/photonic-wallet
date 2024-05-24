import { useParams } from "react-router-dom";
import { t } from "@lingui/macro";
import { Box } from "@chakra-ui/react";
import PageHeader from "@app/components/PageHeader";
import { Atom, AtomType } from "@app/types";
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
  const [atoms, balances] = useLiveQuery(
    async () => {
      // Get all FT atoms
      const atoms = await db.atom.where({ atomType: AtomType.FT }).toArray();

      // Get FT balances by ref
      const refs = atoms.map(({ ref }) => ref);
      const balances = Object.fromEntries(
        (await db.balance.where("id").anyOf(refs).toArray()).map((b) => [
          b.id,
          b,
        ])
      );
      return [atoms, balances];
    },
    [],
    [null, null]
  );

  const hasBalance = (atom: Atom) =>
    atom &&
    balances &&
    (balances[atom.ref]?.confirmed || 0 + balances[atom.ref]?.unconfirmed || 0);

  if (!atoms) {
    return null;
  }

  return (
    <>
      <PageHeader toolbar={<MintMenu />}>{t`Fungible Tokens`}</PageHeader>
      <Box px={4} overflowY="auto">
        {atoms.length === 0 ? (
          <NoContent>{t`No assets`}</NoContent>
        ) : (
          atoms.map(
            (token) =>
              hasBalance(token) && (
                <TokenRow
                  atom={token}
                  value={
                    (balances[token.ref]?.confirmed || 0) +
                    (balances[token.ref]?.unconfirmed || 0)
                  }
                  key={token.ref}
                  to={`/fungible/atom/${token.ref}`}
                  size="sm"
                  defaultIcon={RiQuestionFill}
                />
              )
          )
        )}
      </Box>
    </>
  );
}
