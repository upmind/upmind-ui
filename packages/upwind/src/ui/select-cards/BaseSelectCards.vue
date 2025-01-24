<template>
  <div class="w-full">
    <slot
      name="root"
      :openValue="open.value"
      :setOpenValue="setOpenValue"
      :selected="selected"
      :onFocus="handleFocus"
      :keyEnter="keyEnter"
      :keyArrowDown="keyArrowDown"
      :keyArrowUp="keyArrowUp"
      :items="props.items"
      :onChange="onChange"
      :focusNextItem="focusNextItem"
      :focusPreviousItem="focusPreviousItem"
      :handleOpenAutoFocus="handleOpenAutoFocus"
      :focusRadio="focusRadio"
      :props="props"
    />
  </div>
</template>

<script setup lang="ts">
import { useSelectCards } from "./utils/useSelectCards";
import type { SelectCardsProps } from "./types";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  variant: "dropdown",
  loading: false,
  placeholder: "Select an option",
  required: false,
  overrideIndex: 0,
  useInputGroup: true,
  width: "full",
  separate: false,
  class: "",
  contentClass: "",
});

const emits = defineEmits(["update:modelValue"]);

const {
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
} = useSelectCards(props, emits);

const setOpenValue = (val: boolean) => {
  open.value = val;
};

defineExpose({
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
});
</script>
