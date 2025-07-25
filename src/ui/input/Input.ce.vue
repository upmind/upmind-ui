<template>
  <div :class="cn(styles.container, props.class)">
    <span :class="cn(styles.input.container, props.class)">
      <slot name="prepend">
        <InputItems :icon="props.icon" :avatar="props.avatar" />
      </slot>

      <input
        v-bind="delegatedProps"
        v-model="modelValue"
        :class="cn(styles.input.field, props.class)"
      />

      <slot name="append">
        <InputItems :icon="props.iconAppend" :avatar="props.avatarAppend" />
      </slot>
    </span>
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

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "defaultValue", "modelValue"])
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  size: props.size,
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
