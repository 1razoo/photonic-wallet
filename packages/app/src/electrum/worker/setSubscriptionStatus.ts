import db from "@app/db";

let init = false;

export default async function setSubscriptionStatus(
  scriptHash: string,
  status: string
) {
  await db.subscriptionStatus.put({ scriptHash, status });

  // When restoring a wallet, wait for all subscriptions to be initialised before allowing notifications
  if (!init) {
    const exists = await db.kvp.get("lastNotification");
    if (exists) {
      init = true;
    } else {
      const count = await db.subscriptionStatus.count();
      if (count === 2) {
        const maxId = (await db.txo.orderBy("id").reverse().first())?.id || 0;
        db.kvp.put(maxId, "lastNotification");
        init = true;
      }
    }
  }
}
