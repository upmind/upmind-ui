<template>
  <Label v-bind="delegatedProps" :class="cn(styles.label, props.class)">
    <slot />
  </Label>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import config from "./label.config";
import Label from "./Label.vue";
import { useStyles, cn } from "../../utils";
import { omit } from "lodash-es";
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
