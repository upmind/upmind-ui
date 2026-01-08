<template>
  <Label v-bind="delegatedProps" :class="cn(styles.label, props.class)">
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
import type { LabelProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<LabelProps>(), {
  uiConfig: () => ({ label: [] }),
  class: ""
});
const delegatedProps = computed(() => omit(props, ["uiConfig", "class"]));

const meta = computed(() => ({}));

const styles = useStyles(["label"], meta, config, props.uiConfig ?? {});
</script>
