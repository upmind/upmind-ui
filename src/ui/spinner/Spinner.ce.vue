<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(styles.spinner, props.class)"
    role="status"
    aria-label="animated loading icon"
  >
    <slot />
    <span class="sr-only">Loading...</span>
  </Primitive>
</template>

<script lang="ts" setup>
// --- external
import { Primitive } from "radix-vue";
import { computed } from "vue";
// --- internal
import config from "./spinner.config";
import { useStyles, cn } from "../../utils";
// --- components
// --- utils
// --- types
import type { SpinnerProps } from ".";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SpinnerProps>(), {
  // --- props
  as: "span",
  //  --- styles
  size: "auto",
  // --- styles
  uiConfig: () => ({ spinner: [] }),
  class: ""
});

const meta = computed(() => ({
  size: props.size
  // ---
}));

const styles = useStyles("spinner", meta, config, props.uiConfig ?? {});
</script>
