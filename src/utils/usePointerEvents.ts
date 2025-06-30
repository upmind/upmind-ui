import { onMounted, onBeforeUnmount, nextTick } from "vue";
import type { Ref } from "vue";

export function usePointerEvents(
  isOpen: Ref<boolean>,
  targetSelector?: string | HTMLElement
) {
  const handlePointerEvents = (open: boolean) => {
    if (targetSelector && targetSelector !== "body") {
      const element =
        typeof targetSelector === "string"
          ? document.querySelector(targetSelector)
          : targetSelector;

      if (element) {
        document.body.style.removeProperty("pointer-events");
        (element as HTMLElement).style.setProperty(
          "pointer-events",
          open ? "none" : "auto"
        );
      }
    }
  };

  onMounted(() => {
    if (isOpen.value) {
      nextTick(() => handlePointerEvents(true));
    }
  });

  onBeforeUnmount(() => {
    handlePointerEvents(false);
  });

  return {
    handlePointerEvents
  };
}
