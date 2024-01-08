import { Signal, effect, untracked } from "@preact/signals-react";
import { useEffect } from "react";

export default function useModalSignal(
  signal: Signal<{
    modal?: string;
    onClose?: (success: boolean) => void;
  }>,
  value: string,
  onSignal: (onClose?: (success: boolean) => void) => void
) {
  return useEffect(() => {
    const dispose = effect(() => {
      const current = signal.value;
      if (current.modal === value) {
        const onClose = signal.value?.onClose;
        signal.value = untracked(() => ({}));
        onSignal(onClose);
      }
    });

    return dispose;
  }, []);
}
