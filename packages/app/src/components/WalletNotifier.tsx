import db from "@app/db";
import useContractNotifier from "@app/hooks/useContractNotifier";
import { useToast } from "@chakra-ui/react";
import { t } from "@lingui/macro";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef } from "react";

function ReadyForNotifications({
  lastNotification,
}: {
  lastNotification: number;
}) {
  const notify = useContractNotifier();
  const toast = useToast();

  // Convert to a ref updated by useEffect so we don't need to make it a dependency of useLiveQuery
  // This avoids triggering an additional query after `db.kvp.put(maxId, "lastNotification")`
  const lastNotificationRef = useRef(lastNotification);
  useEffect(() => {
    lastNotificationRef.current = lastNotification;
  }, [lastNotification]);

  const maxNotifications = 10;

  const utxos = useLiveQuery(async () =>
    db.txo
      .where({ change: 0, spent: 0 }) // Get all TXOs that are unspent and not our own change
      .filter((txo) => (txo?.id || 0) > lastNotificationRef.current)
      .toArray()
  );

  // The following code can't be in useLiveQuery because useNotify performs its own queries
  useEffect(() => {
    (async () => {
      let maxId = 0;
      let notifyCount = 0;
      for (const utxo of utxos || []) {
        const id = utxo.id || 0;
        if (id > lastNotificationRef.current) {
          notifyCount++;
          if (notifyCount < maxNotifications) {
            await notify(utxo);
          }
        }
        if (id > maxId) {
          maxId = id;
        }
      }
      if (notifyCount > maxNotifications) {
        toast({
          title: t`Suppressed ${
            notifyCount - maxNotifications
          } more notifications`,
        });
      }
      if (maxId > 0) {
        db.kvp.put(maxId, "lastNotification");
      }
    })();
  }, [utxos]);

  return null;
}

export default function WalletNotifier() {
  // Keep track of the last seen id so we only notify for new transactions
  const lastNotification = useLiveQuery(() =>
    db.kvp.get("lastNotification")
  ) as number;

  if (!lastNotification) return null;

  return <ReadyForNotifications lastNotification={lastNotification} />;
}
