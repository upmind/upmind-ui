<template>
  <Toggle
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(styles.toggle, props.class)"
  >
    <slot />
  </Toggle>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import Toggle from "./Toggle.vue";

// --- internal
import config from "./toggle.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ToggleProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ToggleProps>(), {
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
  variant: props.variant,
  size: props.size,
}));

const styles = useStyles(
  ["toggle"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ toggle: string }>;
</script>
