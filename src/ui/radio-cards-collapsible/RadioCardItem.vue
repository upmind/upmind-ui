<template>
  <Label
    :for="`${props.name}-${index}`"
    :class="styles.radioCards.item"
    :data-state="isSelected ? 'checked' : ''"
  >
    <div v-show="!props.minimal" :class="styles.radioCards.radio">
      <RadioGroupItem
        :id="`${props.name}-${index}`"
        :value="value"
        :name="props.name"
        :required="props.required"
        :disabled="isDisabled"
        :class="styles.radioCards.input"
        :tabindex="isSelected || !modelValue ? 0 : -1"
        :data-state="isSelected ? 'checked' : ''"
        :uiConfig="uiConfig"
        @blur="onBlur"
      />
    </div>
    <slot
      name="item"
      v-bind="{
        item: { ...props.item, value },
        isSelect: isSelected
      }"
    >
      <span v-if="props.label">{{ props.label }}</span>
    </slot>
  </Label>
</template>

<script setup lang="ts">
// --- external
import { watchOnce } from "@vueuse/core";
import { computed } from "vue";
// --- internal
// --- components
import Label from "../label/Label.ce.vue";
import { RadioGroupItem } from "../radio-group";
import config from "./radioCards.config";
import { useStyles, useDisabled } from "../../utils";
// --- types
import type { RadioCardsCollapsibleItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsCollapsibleItemProps>(), {
  // -- variants
  columns: 1
});

const _emits = defineEmits(["focus"]);

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const isDisabled = useDisabled(() => props.disabled);

const meta = computed(() => ({
  isMinimal: props.minimal,
  columns: props.columns,
  isDisabled: isDisabled.value
}));

const styles = useStyles(["radioCards"], meta, config, props.uiConfig ?? {});

const onBlur = (e: FocusEvent) => {
  if (isDisabled.value) {
    watchOnce(
      () => isDisabled.value,
      () => {
        const el = e.target as HTMLElement;
        if (el && el.dataset.state === "checked") {
          el.focus();
        }
      }
    );
  }
};
</script>
