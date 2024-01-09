import { NavLink, useLocation, useParams } from "react-router-dom";
import {
  Button,
  Grid,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Tab,
  TabList,
  Tabs,
} from "@chakra-ui/react";
import { t } from "@lingui/macro";
import TokenCard from "@app/components/TokenCard";
import useTokenQuery from "@app/hooks/useTokenQuery";
import { AtomNft } from "@app/types";
import PageHeader from "@app/components/PageHeader";
import Pagination from "@app/components/Pagination";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { TbBox, TbTriangleSquareCircle, TbUserCircle } from "react-icons/tb";
import ViewPanelLayout from "@app/layouts/ViewPanelLayout";
import useQueryString from "@app/hooks/useQueryString";

const pageSize = 60;

export default function Dashboard({ type = "object" }: { type?: string }) {
  const { sref } = useParams();
  return (
    <ViewPanelLayout context={`/create/${type}`} sref={sref}>
      <TokenGrid open={!!sref} type={type} />
    </ViewPanelLayout>
  );
}

function TokenGrid({
  open,
  type = "object",
}: {
  open: boolean;
  type?: string;
}) {
  const { pathname } = useLocation();
  const { p: pageParam } = useQueryString();
  const page = parseInt(pageParam || "0", 10);
  /*const defaultUser = useLiveQuery<{ txo: TxO; atom: AtomNft } | undefined>(
    async () => {
      const atom = await db.atomNft
        .where("type")
        .equals("user")
        .limit(1)
        .first();
      if (!atom?.lastTxoId) return undefined;
      const txo = await db.txo.get(atom?.lastTxoId);
      if (!txo) return undefined;
      return {
        txo,
        atom,
      };
    }
  );*/
  // Create dashboard will always show users and containers, but only freshly minted objects
  // To move an object out of the create module it must be tranferred
  const criteria =
    type === "object"
      ? (atom: AtomNft) =>
          atom.type === "object" && atom.spent === 0 && atom.fresh === 1
      : (atom: AtomNft) => atom.type === type && atom.spent === 0;

  const tokens = useTokenQuery(criteria, pageSize, page, [type]);

  const toolbar = (
    <HStack gap={4}>
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

      {/* defaultUser?.atom && defaultUser?.txo && (
        <Avatar nft={defaultUser.atom} />
      ) */}
    </HStack>
  );

  return (
    <>
      <PageHeader toolbar={toolbar}>{t`Create`}</PageHeader>

      <Tabs index={["object", "container", "user"].indexOf(type)} mb={4} px={4}>
        <TabList>
          <Tab as={NavLink} to="/create/object">
            {t`Digital Objects`}
          </Tab>
          <Tab as={NavLink} to="/create/container">
            {t`Containers`}
          </Tab>
          <Tab as={NavLink} to="/create/user">
            {t`Users`}
          </Tab>
          <Spacer />
          <Pagination
            alignSelf="baseline"
            page={page}
            startUrl={pathname}
            prevUrl={`${pathname}${page > 1 ? `?p=${page - 1}` : ""}`}
            nextUrl={
              tokens.length == pageSize + 1
                ? `${pathname}?p=${page + 1}`
                : undefined
            }
            size="sm"
          />
        </TabList>
      </Tabs>
      <Grid
        gridTemplateColumns={`repeat(auto-fill, minmax(${
          open ? "168px" : "240px"
        }, 1fr))`}
        gridAutoRows="max-content"
        overflowY="auto"
        pb={4}
        px={4}
        gap={4}
      >
        {tokens
          .slice(0, pageSize)
          .map(
            (token) =>
              token && (
                <TokenCard
                  token={token}
                  key={token.txo.id}
                  to={`/create/${type}/atom/${token.atom.ref}${
                    page > 0 ? `?p=${page}` : ""
                  }`}
                  size={open ? "sm" : "md"}
                />
              )
          )}
      </Grid>
    </>
  );
}
