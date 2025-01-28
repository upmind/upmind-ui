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
  upmindUIConfig: () => ({ label: {} }),
  class: "",
});
const delegatedProps = computed(() => omit(props, ["upmindUIConfig", "class"]));

const meta = computed(() => ({}));

const variants = useStyles(
  ["label"],
  meta,
  config,
  props.upmindUIConfig ?? {}
) as ComputedRef<{ label: string }>;
</script>
