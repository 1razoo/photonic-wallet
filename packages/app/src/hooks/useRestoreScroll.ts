import { useContext, useLayoutEffect } from "react";
import { UNSAFE_DataRouterStateContext } from "react-router-dom";

function useDataRouterState() {
  return useContext(UNSAFE_DataRouterStateContext);
}

/**
 * Work-around for getting ScrollRestoration to work with useLiveQuery
 */
export default function useRestoreScroll() {
  const { restoreScrollPosition } = useDataRouterState() as {
    restoreScrollPosition: number;
  };
  useLayoutEffect(() => {
    if (restoreScrollPosition > 0) {
      window.scrollTo(0, restoreScrollPosition);
    }
  });
}
