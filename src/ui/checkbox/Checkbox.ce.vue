<template>
  <Checkbox
    v-model:checked="checked"
    v-bind="delegatedProps"
    :class="cn(variants.checkbox, props.class)"
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
  upmindUIConfig: () => ({ checkbox: {} }),
  size: "md",
  width: "full",
  class: "",
});

const emits = defineEmits<{
  (e: "update:checked", payload: string | number): void;
}>();

const delegatedProps = computed(() =>
  omit(props, ["class", "upmindUIConfig", "defaultChecked", "checked"])
);

const checked = useVModel(props, "checked", emits, {
  passive: true,
  defaultValue: props.defaultChecked,
});

const meta = computed(() => ({
  size: props.size,
}));

const variants = useStyles(
  ["checkbox"],
  meta,
  config,
  props.upmindUIConfig ?? {}
) as ComputedRef<{ checkbox: string }>;
</script>
