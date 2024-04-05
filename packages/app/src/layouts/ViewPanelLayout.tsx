import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  createRef,
  useContext,
  useState,
} from "react";
import { Box, Grid, useBreakpointValue } from "@chakra-ui/react";
import {
  ImperativePanelHandle,
  MixedSizes,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import ContentContainer from "@app/components/ContentContainer";

export const ViewPanelContext = createContext<
  [boolean, Dispatch<SetStateAction<boolean>>] | null
>(null);

// TODO save these to the database so they persist after exiting
let savedSize = 45;
const minSize = 500;

export function ViewPanelProvider({ children }: PropsWithChildren) {
  const collapsedState = useState(false);
  return (
    <ViewPanelContext.Provider value={collapsedState}>
      {children}
    </ViewPanelContext.Provider>
  );
}

export function useViewPanelContext() {
  const ctx = useContext(ViewPanelContext);
  if (!ctx) {
    throw new Error("ViewPanelProvider required");
  }
  return ctx;
}

export default function ViewPanelLayout({ children }: PropsWithChildren) {
  const [collapsed] = useViewPanelContext();
  const gridPanel = createRef<ImperativePanelHandle>();
  const [isDragging, setIsDragging] = useState(false);
  const is2XL = useBreakpointValue({ base: false, "2xl": true });

  const onLayout = ([, size]: MixedSizes[]) => {
    savedSize = size?.sizePercentage || savedSize;
  };

  const [grid, view] = Array.isArray(children) ? children : [children];

  return (
    <ContentContainer>
      <PanelGroup direction="horizontal" onLayout={onLayout}>
        <Grid
          as={Panel}
          minSizePixels={minSize}
          display={
            view ? { base: "none", "2xl": collapsed ? "none" : "grid" } : "grid"
          }
          gridTemplateRows="auto auto 1fr"
          height="100vh"
          ref={gridPanel}
          collapsible={!isDragging}
        >
          {grid}
        </Grid>
        {view && (
          <>
            <Box
              as={PanelResizeHandle}
              onDragging={(drag: boolean) => setIsDragging(drag)}
              order={0}
              display="flex"
              width={collapsed || !is2XL ? 0 : "8px"}
              bgColor="whiteAlpha.200"
              sx={{
                "&[data-resize-handle-active], &:hover": {
                  bgColor: "lightBlue.A400",
                },
                "&:hover": {
                  transitionDelay: "0.5s",
                  transition: "0.3s background-color",
                },
              }}
            />
            <Box
              as={Panel}
              order={1}
              minSizePixels={minSize}
              defaultSizePercentage={savedSize}
              height="100vh"
            >
              {view}
            </Box>
          </>
        )}
      </PanelGroup>
    </ContentContainer>
  );
}
