import { PropsWithChildren, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Box, useBreakpointValue } from "@chakra-ui/react";
import SideBar from "@app/components/SideBar";
import { openMenu, wallet } from "@app/signals";
import { computed, effect, signal } from "@preact/signals-react";
import { useSwipeable } from "react-swipeable";

const swipeX = signal(0);
const swipeWidth = signal(0);
const swipeFraction = computed(() =>
  swipeWidth.value > 0 ? Math.min(1, swipeX.value / swipeWidth.value) : 0
);
const isSwiping = signal(false);
const swipeStartDelta = 20;

function DeviceSelect({ children }: PropsWithChildren) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      openMenu.value = false;
    },
    onSwiping: (swipe) => {
      if (swipe.dir === "Left") {
        swipeX.value = swipeWidth.value + swipe.deltaX + swipeStartDelta;
        if (!isSwiping.value) isSwiping.value = true;
      } else {
        if (isSwiping.value) isSwiping.value = false;
      }
    },
    onSwiped: () => (isSwiping.value = false),
    delta: swipeStartDelta,
  });

  useEffect(
    () =>
      effect(() => {
        if (openMenu.value) {
          swipeX.value = swipeWidth.value;
        } else {
          swipeX.value = 0;
        }
      }),
    []
  );

  swipeWidth.value =
    useBreakpointValue({
      base: window.innerWidth * 0.75,
      lg: 0,
    }) || 0;

  return (
    <>
      <Box
        display={{ lg: "none" }}
        position="fixed"
        top="0"
        bottom="0"
        left="-100%"
        right="0"
        width="100%"
        bg="blackAlpha.400"
        zIndex={15}
        transform={
          isSwiping.value || swipeFraction.value === 1
            ? "translate3d(100%, 0, 0)"
            : ""
        }
        opacity={swipeFraction.value}
        transition="opacity 0.2s"
      />
      <Box
        position="fixed"
        width={{ base: "100vw", lg: "auto" }}
        height="100vh"
        zIndex={20}
        left={{
          base: isSwiping.value || swipeFraction.value === 1 ? "-75%" : "-100%",
          lg: "initial",
        }}
        transform={{
          base: `translate3d(calc(75% * ${swipeFraction}), 0, 0)`,
          lg: "initial",
        }}
        transition={{
          base: isSwiping.value ? "none" : "transform 0.2s",
          lg: "none",
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            openMenu.value = false;
          }
        }}
        {...swipeHandlers}
      >
        {children}
      </Box>
    </>
  );
}

export default function WalletLayout() {
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => (openMenu.value = true),
    onSwiping: (swipe) => {
      if (swipe.dir === "Right") {
        swipeX.value = swipe.deltaX - swipeStartDelta;
        if (!isSwiping.value) isSwiping.value = true;
      } else {
        if (isSwiping.value) isSwiping.value = false;
      }
    },
    onSwiped: () => (isSwiping.value = false),
    delta: swipeStartDelta,
  });

  if (!wallet.value.ready) return null;

  if (!wallet.value.exists) {
    console.debug("No wallet found");
    return <Navigate to="/create-wallet" />;
  }

  return (
    <>
      <DeviceSelect>
        <SideBar />
      </DeviceSelect>
      <Box
        {...swipeHandlers}
        transform={
          swipeFraction.value === 0
            ? "initial"
            : `scale3d(calc(1 - 0.1 * ${swipeFraction.value}), calc(1 - 0.1 * ${swipeFraction.value}), 1)`
        }
        transformOrigin="top right"
        transition={
          isSwiping.value
            ? "initial"
            : "transform 0.2s ease-out, opacity 0.2s ease-out"
        }
      >
        <Outlet />
      </Box>
    </>
  );
}
