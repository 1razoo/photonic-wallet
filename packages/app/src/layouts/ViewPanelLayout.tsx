import {
  PropsWithChildren,
  createContext,
  createRef,
  useContext,
  useState,
} from "react";
import {
  Box,
  Grid,
  Icon,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  ImperativePanelHandle,
  MixedSizes,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { RiContractRightLine, RiExpandLeftLine } from "react-icons/ri";
import ContentContainer from "@app/components/ContentContainer";
import ViewAsset from "@app/components/ViewAsset";

const ViewPanelContext = createContext(false);

// TODO save these to the database so they persist after exiting
let savedSize = 45;
let savedCollapsed = false;
const minSize = 500;

export function useViewPanelContext() {
  return useContext(ViewPanelContext);
}

export default function ViewPanelLayout({
  sref,
  context,
  children,
}: PropsWithChildren<{
  sref?: string;
  context: string;
}>) {
  const gridPanel = createRef<ImperativePanelHandle>();
  const [collapsed, setCollapsed] = useState(savedCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const is2XL = useBreakpointValue({ base: false, "2xl": true });

  const onLayout = ([, size]: MixedSizes[]) => {
    savedSize = size?.sizePercentage || savedSize;
  };

  const changeCollapsed = (newCollapsed: boolean) => {
    savedCollapsed = newCollapsed;
    if (newCollapsed) {
      gridPanel.current?.collapse();
    } else {
      gridPanel.current?.expand();
    }
    setCollapsed(!collapsed);
  };

  return (
    <ContentContainer>
      <ViewPanelContext.Provider value={collapsed || !is2XL}>
        <PanelGroup direction="horizontal" onLayout={onLayout}>
          <Grid
            as={Panel}
            minSizePixels={minSize}
            display={
              sref
                ? { base: "none", "2xl": collapsed ? "none" : "grid" }
                : "grid"
            }
            gridTemplateRows="auto auto 1fr"
            height="100vh"
            ref={gridPanel}
            collapsible={!isDragging}
          >
            {children}
          </Grid>
          {sref && (
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
                <ViewAsset
                  toolbar={
                    <IconButton
                      display={{ base: "none", "2xl": "flex" }}
                      isRound
                      aria-label="Back"
                      variant="ghost"
                      icon={
                        <Icon
                          as={
                            collapsed ? RiContractRightLine : RiExpandLeftLine
                          }
                          fontSize="2xl"
                        />
                      }
                      onClick={() => changeCollapsed(!collapsed)}
                    />
                  }
                  sref={sref}
                  size={collapsed || !is2XL ? "md" : "sm"}
                  context={context}
                />
              </Box>
            </>
          )}
        </PanelGroup>
      </ViewPanelContext.Provider>
    </ContentContainer>
  );
}
