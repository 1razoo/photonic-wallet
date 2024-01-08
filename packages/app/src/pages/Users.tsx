import { Grid } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import ContentContainer from "@app/components/ContentContainer";
import NoContent from "@app/components/NoContent";
import useRestoreScroll from "@app/hooks/useRestoreScroll";
import TokenCard from "@app/components/TokenCard";
import useTokenQuery from "@app/hooks/useTokenQuery";
import Pagination from "@app/components/Pagination";

const pageSize = 20;

export default function Users() {
  const { page: pageParam } = useParams();
  const page = parseInt(pageParam || "0", 10);
  const nft = useTokenQuery((atom) => atom.type === "user", pageSize, page);

  useRestoreScroll();

  if (nft.length === 0) {
    return <NoContent>No users</NoContent>;
  }

  return (
    <>
      <ContentContainer>
        <Pagination
          page={page}
          nextUrl={
            nft.length == pageSize + 1
              ? `/create/users/${page + 1}/${nft[pageSize]?.txo?.id}`
              : undefined
          }
        />
        <Grid
          gridTemplateColumns="repeat(auto-fill, minmax(240px, 1fr))"
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
                    to={`/create/asset/${token.txo.id}`}
                  />
                )
            )}
        </Grid>
      </ContentContainer>
    </>
  );
}
