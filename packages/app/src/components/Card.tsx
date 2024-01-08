import { Box, BoxProps, forwardRef } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default forwardRef<BoxProps, "div">(function Card(
  { children, ...rest }: PropsWithChildren,
  ref
) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      backgroundColor="bg.100"
      boxShadow="sm"
      borderRadius="lg"
      p={8}
      ref={ref}
      {...rest}
    >
      {children}
    </Box>
  );
});
