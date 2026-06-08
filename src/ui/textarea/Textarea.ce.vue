<template>
  <Textarea
    v-model="modelValue"
    v-bind="delegatedProps"
    :class="cn(styles.textarea, props.class)"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
  />
</template>

<script lang="ts" setup>
// --- external
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
// --- components
import config from "./textarea.config";
import Textarea from "./Textarea.vue";
// --- internal
import { useStyles, cn, useDisabled, useReadonly } from "../../utils";
// --- utils
import { assign, omit } from "lodash-es";
// --- types
import type { TextareaProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TextareaProps>(), {
  uiConfig: () => ({ textarea: [] }),
  class: ""
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const isDisabled = useDisabled(() => props.disabled);
const isReadonly = useReadonly(() => props.readonly);

const delegatedProps = computed(() =>
  assign(omit(props, ["class", "uiConfig", "defaultValue", "modelValue"]), {
    disabled: isDisabled.value,
    readonly: isReadonly.value
  })
);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  //
}));

const styles = useStyles(["textarea"], meta, config, props.uiConfig ?? {});
</script>
