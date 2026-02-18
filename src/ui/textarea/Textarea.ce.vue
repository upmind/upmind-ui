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
import { useVModel } from "@vueuse/core";
import { computed } from "vue";
import config from "./textarea.config";
import Textarea from "./Textarea.vue";
import { useStyles, cn } from "../../utils";
import { omit } from "lodash-es";
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

const styles = useStyles(["textarea"], meta, config, props.uiConfig ?? {});
</script>
