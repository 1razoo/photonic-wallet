import db from "@app/db";
import { PromiseExtended } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

export default function useIpfsUrl(ipfsUrl: string) {
  const [ipfsMethod, ipfsGatewayUrl] = useLiveQuery(
    () =>
      db.kvp.bulkGet(["ipfsMethod", "ipfsGatewayUrl"]) as PromiseExtended<
        [string, string]
      >,
    [],
    ["", ""]
  );

  if (ipfsMethod === "gateway") {
    return ipfsGatewayUrl.replace("{cid}", ipfsUrl.replace("ipfs://", ""));
  }

  return ipfsUrl;
}
