<template>
  <Textarea
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(variants.textarea, props.class)"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import Textarea from "./Textarea.vue";

// --- internal
import config from "./textarea.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { TextareaProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TextareaProps>(), {
  upwindConfig: () => ({ textarea: {} }),
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

const meta = computed(() => ({
  size: props.size,
}));

const variants = useStyles(
  ["textarea"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ textarea: string }>;
</script>
