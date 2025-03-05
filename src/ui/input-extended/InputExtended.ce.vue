<template>
  <InputExtended
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(styles.container, props.class)"
    :input-class="styles.input"
  >
    <template #prepend>
      <slot name="prepend" />
    </template>
    <template #append>
      <slot name="append" />
    </template>
  </InputExtended>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import InputExtended from "./InputExtended.vue";

// --- internal
import config from "./inputExtended.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InputExtendedProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InputExtendedProps>(), {
  width: "full",
  size: "md",
  // ---
  uiConfig: () => ({ input: [] }),
  class: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "defaultValue", "modelValue", "inputSize"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  inputSize: props.inputSize,
  width: props.width,
}));

const styles = useStyles(
  ["input", "container"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  container: string;
  input: string;
}>;
</script>
