<template>
  <Checkbox
    v-model:checked="checked"
    v-bind="delegatedProps"
    :class="cn(styles.checkbox, props.class)"
    @keydown.enter="handleEnter"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import Checkbox from "./Checkbox.vue";

// --- internal
import config from "./checkbox.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { CheckboxProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<CheckboxProps>(), {
  uiConfig: () => ({ checkbox: [] }),
  size: "md",
  width: "full",
  class: ""
});

const emits = defineEmits<{
  (e: "update:checked", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "uiConfig", "defaultChecked", "checked"])
);

const checked = useVModel(props, "checked", emits, {
  passive: true,
  defaultValue: props.defaultChecked
});

const meta = computed(() => ({
  size: props.size
}));

const styles = useStyles(
  ["checkbox"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ checkbox: string }>;

const handleEnter = () => {
  checked.value = !checked.value;
};
</script>
