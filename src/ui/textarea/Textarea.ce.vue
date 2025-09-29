<template>
  <Textarea
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(styles.textarea, props.class)"
    :data-hover="$attrs['data-hover']"
    :data-focus="$attrs['data-focus']"
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
  uiConfig: () => ({ textarea: [] }),
  class: ""
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "defaultValue", "modelValue"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  //
}));

const styles = useStyles(
  ["textarea"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ textarea: string }>;
</script>
