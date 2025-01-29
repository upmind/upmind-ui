import { ref, computed, watch, nextTick, type Ref } from "vue";
import { useVModel } from "@vueuse/core";
import { find, first, findIndex } from "lodash-es";
import { useFocus } from "@vueuse/core";
import { useFocusNavigation } from "../../../utils/useFocusNavigation";
import type {TemplateRef}
import type { SelectCardsProps } from "../types";

export function useSelectCards(
  props: SelectCardsProps,
  emits: any,
  itemRefs: TemplateRef,
  focusRoot?: Ref<HTMLElement | null>
) {
  const modelValue = useVModel(props, "modelValue", emits, {
    passive: true,
    defaultValue: props.defaultValue,
  });

  const open = ref(false);
  const focusedElement = ref<HTMLElement | null>(null);

  const selected = computed(() =>
    find(props.items, { value: modelValue.value })
  );

  const meta = computed(() => ({
    variant: props.variant,
    isCollapsible: props.variant === "collapsible",
  }));

  watch(
    () => props.disabled,
    isDisabled => {
      if (!isDisabled && focusedElement.value) {
        nextTick(() => {
          const { focused } = useFocus(focusedElement.value);
          focused.value = true;
        });
      }
    }
  );

  const handleFocus = (event: FocusEvent) => {
    focusedElement.value = event.target as HTMLElement;
    if (
      !props.useInputGroup &&
      !find(props.items, { value: modelValue.value })
    ) {
      modelValue.value = first(props.items)?.value;
    }
  };

  const handleBlur = () => {
    if (!props.disabled) {
      focusedElement.value = null;
    }
  };

  const manuallySelected = computed(() => {
    return selected.value && selected.value !== first(props.items)
      ? selected.value
      : undefined;
  });

  function onChange(value: any) {
    if (!props.required && modelValue.value === value) {
      modelValue.value = undefined;
    } else {
      modelValue.value = value;
    }
    open.value = false;
  }

  const focusRadio = () => {
    if (focusRoot?.value) {
      const { focused } = useFocus(focusRoot.value);
      focused.value = true;
    }
    open.value = false;
  };

  const { focusFirstItem, focusLastItem, focusNextItem, focusPreviousItem } =
    useFocusNavigation(itemRefs, focusRadio);

  const handleOpenAutoFocus = (event?: Event) => {
    event?.preventDefault?.();
    requestAnimationFrame(() => {
      const selectedItemIndex = findIndex(
        props.items,
        item => item.value === modelValue.value
      );
      const index = selectedItemIndex >= 0 ? selectedItemIndex : 0;
      if (itemRefs.value[index]) {
        const { focused } = useFocus(itemRefs.value[index]);
        focused.value = true;
      }
    });
  };

  const keyEnter = () => {
    if (meta.value.isCollapsible) {
      open.value = !open.value;
    }
    handleOpenAutoFocus();
  };

  const keyArrowDown = () => {
    if (props.useInputGroup) {
      open.value = true;
      focusFirstItem();
    }
  };

  const keyArrowUp = () => {
    if (props.useInputGroup) {
      open.value = true;
      focusLastItem();
    }
  };

  return {
    modelValue,
    open,
    selected,
    meta,
    itemRefs,
    focusRoot,
    manuallySelected,
    handleFocus,
    handleBlur,
    onChange,
    handleOpenAutoFocus,
    keyEnter,
    keyArrowDown,
    keyArrowUp,
    focusNextItem,
    focusPreviousItem,
    focusRadio,
  };
}
