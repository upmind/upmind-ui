<template>
  <div
    :class="styles.radioCards.item"
    :data-state="isSelected ? 'checked' : 'unchecked'"
  >
    <Label :for="`${props.name}-${index}`" :class="cn(styles.radioCards.label)">
      <div :class="styles.radioCards.radio">
        <RadioGroupItem
          :id="`${props.name}-${index}`"
          :value="item.value"
          :name="props.name"
          :required="props.required"
          :disabled="props.disabled"
          :class="styles.radioCards.input"
          @focus="handleFocus"
          @blur="handleBlur"
          :tabindex="isSelected || !modelValue ? 0 : -1"
        />
      </div>
      <slot
        name="item"
        v-bind="{
          item: props.item,
        }"
      >
        <span v-if="props.label">{{ props.label }}</span>
      </slot>
    </Label>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { ref, watch, nextTick } from "vue";
import { useFocus } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import Label from "../label/Label.ce.vue";
import { RadioGroupItem } from "../radio-group";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsItemProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsItemProps>(), {
  // -- variants
  width: 12,
});

const emits = defineEmits(["focus"]);

const focusedElement = ref<HTMLElement | null>(null);

const isSelected = computed(() => {
  return props.modelValue === props.item.value;
});

const handleFocus = (event: FocusEvent) => {
  focusedElement.value = event.target as HTMLElement;
  emits("focus", event);
};

const handleBlur = () => {
  if (!props.disabled) {
    focusedElement.value = null;
  }
};

const meta = computed(() => ({
  width: props.width,
}));

const styles = useStyles(
  ["radioCards"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  radioCards: {
    trigger: string;
    root: string;
    item: string;
    radio: string;
    input: string;
    label: string;
  };
}>;

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
</script>
