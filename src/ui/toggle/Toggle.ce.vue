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
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import config from "./toggle.config";
import Toggle from "./Toggle.vue";
import { useStyles, cn } from "../../utils";
import { omit } from "lodash-es";
import type { ToggleProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ToggleProps>(), {
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
  variant: props.variant,
  size: props.size
}));

const styles = useStyles(["toggle"], meta, config, props.uiConfig ?? {});
</script>
