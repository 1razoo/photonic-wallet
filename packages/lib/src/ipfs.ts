import { NFTStorage } from "nft.storage";

export async function encodeCid(data: ArrayBuffer) {
  const blob = new Blob([data]);
  const { cid } = await NFTStorage.encodeBlob(blob);
  return cid.toString();
}

export async function upload(
  data: ArrayBuffer,
  expectedCid: string,
  dryRun: boolean,
  apiKey: string
): Promise<string> {
  const store = new NFTStorage({ token: apiKey });
  const blob = new Blob([data]);

  const { car, cid: encodedCid } = await NFTStorage.encodeBlob(blob);

  if (expectedCid !== encodedCid.toString()) {
    throw new Error("IPFS CID does not match");
  }

  if (dryRun) {
    return encodedCid.toString();
  }

  const cid = await store.storeCar(car);

  if (expectedCid !== cid.toString()) {
    throw new Error("IPFS CID does not match");
  }

  const status = await store.status(cid);
  return status.cid;
}
