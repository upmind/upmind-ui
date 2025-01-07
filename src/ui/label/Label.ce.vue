<template>
  <Label v-bind="delegatedProps" :class="cn(variants.label, props.class)">
    <slot />
  </Label>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import Label from "./Label.vue";

// --- internal
import config from "./label.config";
import { useStyles, cn } from "../../utils";

// --- utils
import { omit } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { LabelProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<LabelProps>(), {
  upwindConfig: () => ({ label: {} }),
  class: "",
});
const delegatedProps = computed(() => omit(props, ["upwindConfig", "class"]));

const meta = computed(() => ({}));

const variants = useStyles(
  ["label"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ label: string }>;
</script>
