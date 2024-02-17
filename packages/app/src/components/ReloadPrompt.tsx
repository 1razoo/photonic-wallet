import { useRegisterSW } from "virtual:pwa-register/react";
import { pwaInfo } from "virtual:pwa-info";
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";

console.log(pwaInfo);

function ReloadPrompt() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const closeRef = useRef<HTMLButtonElement>(null);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) onOpen();
  }, [needRefresh]);

  useEffect(() => {
    if (offlineReady)
      toast({ status: "info", title: "App ready for offline use" });
  }, [offlineReady]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    onClose();
  };

  return (
    <AlertDialog
      motionPreset="slideInBottom"
      leastDestructiveRef={closeRef}
      onClose={close}
      isOpen={isOpen}
      isCentered
    >
      <AlertDialogOverlay />

      <AlertDialogContent>
        <AlertDialogHeader>Update available</AlertDialogHeader>
        <AlertDialogCloseButton />
        <AlertDialogBody>Reload to update</AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={closeRef} onClick={close}>
            Close
          </Button>
          <Button
            variant="primary"
            ml={3}
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ReloadPrompt;
