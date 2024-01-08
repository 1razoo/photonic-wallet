import { Grid } from "@chakra-ui/react";
import { useLocation, useParams } from "react-router-dom";
import NoContent from "@app/components/NoContent";
import useRestoreScroll from "@app/hooks/useRestoreScroll";
import TokenCard from "@app/components/TokenCard";
import useTokenQuery from "@app/hooks/useTokenQuery";
import Pagination from "@app/components/Pagination";
import PageHeader from "@app/components/PageHeader";
import ViewPanelLayout from "@app/layouts/ViewPanelLayout";
import useQueryString from "@app/hooks/useQueryString";

const pageSize = 60;

export default function Wallet() {
  const { sref } = useParams();
  return (
    <ViewPanelLayout sref={sref} context={`/objects`}>
      <TokenGrid open={!!sref} />
    </ViewPanelLayout>
  );
}

function TokenGrid({ open }: { open: boolean }) {
  const { pathname } = useLocation();
  const { p: pageParam } = useQueryString();
  const page = parseInt(pageParam || "0", 10);
  const nft = useTokenQuery(
    (atom) => atom.type === "object" && atom.spent === 0 && atom.fresh === 0, // Freshly minted tokens are in the create module
    pageSize,
    page
  );

  useRestoreScroll();

  if (nft.length === 0) {
    return <NoContent>No assets</NoContent>;
  }

  return (
    <>
      <PageHeader
        toolbar={
          <Pagination
            page={page}
            startUrl={pathname}
            prevUrl={`${pathname}${page > 1 ? `?p=${page - 1}` : ""}`}
            nextUrl={
              nft.length == pageSize + 1
                ? `${pathname}?p=${page + 1}`
                : undefined
            }
          />
        }
      >
        Digital Objects
      </PageHeader>

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
                  token={token}
                  key={token.txo.id}
                  to={`/objects/atom/${token.atom.ref}${
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
