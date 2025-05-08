<template>
  <Input
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(styles.input, props.class)"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import Input from "./Input.vue";

// --- internal
import config from "./input.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InputProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InputProps>(), {
  width: "full",
  // ---
  uiConfig: () => ({ input: [] }),
  class: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "defaultValue", "modelValue"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  size: props.size,
  width: props.width,
}));

const styles = useStyles(
  ["input"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ input: string }>;
</script>
