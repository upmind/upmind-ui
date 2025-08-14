<template>
  <div :class="cn(styles.input.container, props.class)">
    <slot name="prepend">
      <InputItems :icon="props.icon" :avatar="props.avatar" />
    </slot>

    <input
      v-bind="delegatedProps"
      v-model="modelValue"
      :class="styles.input.field"
    />

    <slot name="append">
      <InputItems :icon="props.iconAppend" :avatar="props.avatarAppend" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import config from "./input.config";
import { useStyles, cn } from "../../utils";

// --- components
import InputItems from "./InputItems.vue";

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
  class: ""
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const delegatedProps = computed(
  (): Omit<
    InputProps,
    | "class"
    | "uiConfig"
    | "defaultValue"
    | "modelValue"
    | "width"
    | "size"
    | "icon"
    | "avatar"
    | "iconAppend"
    | "avatarAppend"
  > =>
    omit(props, [
      "class",
      "uiConfig",
      "defaultValue",
      "modelValue",
      "width",
      "size",
      "icon",
      "avatar",
      "iconAppend",
      "avatarAppend"
    ])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  width: props.width
}));

const styles = useStyles(
  ["container", "input"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  container: string;
  input: { container: string; field: string };
}>;
</script>
