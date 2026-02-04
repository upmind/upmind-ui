<template>
  <Switch
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(styles.switch, props.class)"
  />
</template>

<script lang="ts" setup>
// --- external
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
// --- components
import config from "./switch.config";
import Switch from "./Switch.vue";
// --- internal
import { useStyles, cn } from "../../utils";
// --- utils
import { omit } from "lodash-es";
// --- types
import type { SwitchProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SwitchProps>(), {
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

const meta = computed(() => ({}));

const styles = useStyles(["switch"], meta, config, props.uiConfig ?? {});
</script>
