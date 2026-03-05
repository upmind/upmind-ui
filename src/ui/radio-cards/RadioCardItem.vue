<template>
  <Label
    :for="`${props.name}-${index}`"
    :class="cn(styles.radioCards.item.root, styles.radioCards.item.size)"
    :data-state="isSelected ? 'checked' : ''"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
  >
    <span :class="styles.radioCards.radio" @click.capture="onRadioClick">
      <RadioGroupItem
        :id="`${props.name}-${index}`"
        :value="value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :tabindex="isSelected || !modelValue ? 0 : -1"
        :data-state="isSelected ? 'checked' : 'unchecked'"
        :uiConfig="uiConfig"
        @blur="onBlur"
        :data-focus="props.dataFocus"
        :data-hover="props.dataHover"
      />
    </span>
    <slot
      name="item"
      v-bind="{
        item: { ...props.item, value }
      }"
    >
      <ItemContent
        :item="props"
        @action="emits('action', $event)"
      />
    </slot>
  </Label>
</template>

<script setup lang="ts">
// --- external
import { watchOnce } from "@vueuse/core";
import { computed } from "vue";
// --- internal
import { ItemContent } from "../item-content";
import Label from "../label/Label.ce.vue";
import { RadioGroupItem } from "../radio-group";
import config from "./radioCards.config";
import { cn, useStyles } from "../../utils";
// --- types
import type { RadioCardsItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsItemProps>(), {
  // -- variants
  columns: 1
});

const emits = defineEmits<{
  click: [Event];
  action: [event: Event];
}>();

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const meta = computed(() => ({
  columns: props.columns
}));

const styles = useStyles(
  ["radioCards", "radioCards.item", "radioCards.content"],
  meta,
  config,
  props.uiConfig ?? {}
);

const onBlur = (e: FocusEvent) => {
  if (props.disabled) {
    watchOnce(
      () => props.disabled,
      () => {
        const el = e.target as HTMLElement;
        if (el && el.dataset.state === "checked") {
          el.focus();
        }
      }
    );
  }
};

/**
 * Handle clicks on the radio button.
 * When already selected, intercept the click to allow deselection
 * (radix-vue doesn't emit update:model-value for clicks on already-selected items)
 */
const onRadioClick = (e: MouseEvent) => {
  if (isSelected.value) {
    e.stopPropagation();
    e.preventDefault();
    emits("click", e);
  }
};
</script>
