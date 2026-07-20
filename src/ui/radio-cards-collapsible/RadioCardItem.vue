<template>
  <Label
    v-bind="testAttrs"
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
        :disabled="props.disabled"
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
import { watchOnce } from "@vueuse/core";
import { computed } from "vue";
import Label from "../label/Label.ce.vue";
import { RadioGroupItem } from "../radio-group";
import config from "./radioCards.config";
import { useStyles, useTestAttrs } from "../../utils";
import type { RadioCardsCollapsibleItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsCollapsibleItemProps>(), {
  // -- variants
  columns: 1
});

/* Routes props.dataAttrs through useTestAttrs instead of binding it raw, so
   data-test-* keys are stripped from PROD builds like everywhere else. */
const testAttrs = useTestAttrs({
  key: "radio-card-item",
  value: props.value,
  dataAttrs: props.dataAttrs
});

const _emits = defineEmits(["focus"]);

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const meta = computed(() => ({
  isMinimal: props.minimal,
  columns: props.columns
}));

const styles = useStyles(["radioCards"], meta, config, props.uiConfig ?? {});

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
</script>
