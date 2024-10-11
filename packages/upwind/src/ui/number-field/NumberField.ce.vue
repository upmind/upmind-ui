<template>
  <NumberFieldRoot
    v-bind="forwarded"
    :class="cn(variants.numberField.field, props.class)"
  >
    <NumberFieldContent>
      <NumberFieldDecrement
        :class="variants.numberField.color"
        v-bind="forwarded"
      />
      <NumberFieldInput :class="variants.numberField.color" />
      <NumberFieldIncrement
        :class="variants.numberField.color"
        v-bind="forwarded"
      />
    </NumberFieldContent>
  </NumberFieldRoot>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useForwardPropsEmits } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./numberField.config";

// --- components
import {
  NumberFieldRoot,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "./";

// --- types
import type { NumberFieldRootEmits } from "radix-vue";
import type { NumberFieldProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<NumberFieldProps>(), {
  // -- variants
  width: "default",
  variant: "control",
  color: "base",
  // --- styles
  upwindConfig: () => ({ select: {} }),
  class: "",
});

const emits = defineEmits<NumberFieldRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  variant: props.variant,
  width: props.width,
  color: props.color,
}));

const variants = useStyles(
  ["numberField"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  numberField: { field: string; color: string };
}>;
</script>
