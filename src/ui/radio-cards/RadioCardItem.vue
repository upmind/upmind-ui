<template>
  <Label
    :for="`${props.name}-${index}`"
    :class="cn(styles.radioCards.item)"
    :data-state="isSelected ? 'checked' : ''"
  >
    <div :class="styles.radioCards.radio">
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
      />
    </div>
    <slot
      name="item"
      v-bind="{
        item: { ...props.item, value }
      }"
    >
      <span v-if="props.label">{{ props.label }}</span>
      <span v-if="props.sublabel" :class="styles.radioCards.sublabel">{{
        props.sublabel
      }}</span>
    </slot>
  </Label>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { watchOnce } from "@vueuse/core";

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
  isList: false
});

const emits = defineEmits(["focus"]);

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const meta = computed(() => ({
  isList: props.list,
  width: props.width
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
    sublabel: string;
  };
}>;

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
