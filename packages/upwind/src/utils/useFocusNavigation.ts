import { useFocus } from "@vueuse/core";
import type { Ref } from "vue";

export function useFocusNavigation(
  itemRefs: Ref<HTMLElement[]>,
  unfocus: () => void
) {
  const focusFirstItem = () => focusItem(0);
  const focusLastItem = () => focusItem(itemRefs.value.length - 1);
  const focusItem = (index: number) => {
    const item = itemRefs.value[index];
    if (item) {
      const { focused } = useFocus(item);
      focused.value = true;
    }
  };

  const focusNextItem = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < itemRefs.value.length) {
      focusItem(nextIndex);
    } else {
      focusItem(0);
    }
  };
  const focusPreviousItem = (currentIndex: number) => {
    const previousIndex = currentIndex - 1;
    if (previousIndex >= 0) {
      focusItem(previousIndex);
    } else {
      unfocus();
    }
  };

  return {
    focusFirstItem,
    focusLastItem,
    focusNextItem,
    focusPreviousItem,
  };
}
