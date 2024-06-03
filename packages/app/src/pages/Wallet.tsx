import { useState } from "react";
import {
  Button,
  Grid,
  HStack,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Spacer,
} from "@chakra-ui/react";
import { useLocation, useParams } from "react-router-dom";
import { t } from "@lingui/macro";
import NoContent from "@app/components/NoContent";
import useRestoreScroll from "@app/hooks/useRestoreScroll";
import TokenCard from "@app/components/TokenCard";
import useNftQuery from "@app/hooks/useNftQuery";
import Pagination from "@app/components/Pagination";
import PageHeader from "@app/components/PageHeader";
import ViewPanelLayout from "@app/layouts/ViewPanelLayout";
import useQueryString from "@app/hooks/useQueryString";
import ViewDigitalObject from "@app/components/ViewDigitalObject";
import { ChevronDownIcon } from "@chakra-ui/icons";
import MintMenu from "@app/components/MintMenu";
import ActionIcon from "@app/components/ActionIcon";
import { MdFilterAlt } from "react-icons/md";

const pageSize = 60;

export default function Wallet() {
  const { sref } = useParams();

  return (
    <ViewPanelLayout>
      <TokenGrid open={!!sref} />
      {sref && <ViewDigitalObject sref={sref} context="/objects" />}
    </ViewPanelLayout>
  );
}

function TokenGrid({ open }: { open: boolean }) {
  const allTypes = ["object", "container", "user"];
  const { pathname } = useLocation();
  const { p: pageParam } = useQueryString();
  const page = parseInt(pageParam || "0", 10);
  const [filterType, setFilterType] = useState<string[]>(allTypes);
  const nft = useNftQuery(
    (rst) =>
      rst.spent === 0 &&
      (filterType.length ? filterType.includes(rst.type) : true),
    pageSize,
    page,
    [filterType]
  );

  useRestoreScroll();

  return (
    <>
      <PageHeader toolbar={<MintMenu />}>{t`Digital Objects`}</PageHeader>

      <HStack height="42px" gap={4} mb={2} mx={4} alignItems="start">
        <Menu closeOnSelect={false}>
          <MenuButton
            as={Button}
            size="sm"
            aria-label={t`Filter`}
            leftIcon={<ActionIcon as={MdFilterAlt} />}
            rightIcon={<ChevronDownIcon />}
          >
            {t`Filter`}
          </MenuButton>
          <MenuList minWidth="240px">
            <MenuOptionGroup
              title="Type"
              type="checkbox"
              onChange={(types) => setFilterType(types as string[])}
            >
              <MenuItemOption value="object">{t`Object`}</MenuItemOption>
              <MenuItemOption value="container">{t`Container`}</MenuItemOption>
              <MenuItemOption value="user">{t`User`}</MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Menu>
        <Spacer />
        <Pagination
          size="sm"
          page={page}
          startUrl={pathname}
          prevUrl={`${pathname}${page > 1 ? `?p=${page - 1}` : ""}`}
          nextUrl={
            nft.length == pageSize + 1 ? `${pathname}?p=${page + 1}` : undefined
          }
        />
      </HStack>

      {nft.length === 0 ? (
        <NoContent>{t`No assets`}</NoContent>
      ) : (
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
          {nft
            .slice(0, pageSize)
            .map(
              (token) =>
                token && (
                  <TokenCard
                    rst={token.rst}
                    value={token.txo.value}
                    key={token.txo.id}
                    to={`/objects/token/${token.rst.ref}${
                      page > 0 ? `?p=${page}` : ""
                    }`}
                    size={open ? "sm" : "md"}
                  />
                )
            )}
        </Grid>
      )}
    </>
  );
}
