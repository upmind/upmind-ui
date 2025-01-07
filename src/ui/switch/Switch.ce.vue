<template>
  <Switch
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(variants.switch, props.class)"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import Switch from "./Switch.vue";

// --- internal
import config from "./switch.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { SwitchProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SwitchProps>(), {
  upwindConfig: () => ({ input: {} }),
  class: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "upwindConfig", "defaultValue", "modelValue"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({}));

const variants = useStyles(
  ["switch"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ switch: string }>;
</script>
