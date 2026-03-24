<template>
  <Switch v-bind="forwarded" :class="cn(styles.switch, props.class)" />
</template>

<script lang="ts" setup>
// --- external
import { type SwitchRootEmits, useForwardPropsEmits } from "radix-vue";
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

const emits = defineEmits<SwitchRootEmits>();

const delegatedProps = computed(() => omit(props, ["class", "uiConfig"]));

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const styles = useStyles(["switch"], {}, config, props.uiConfig ?? {});
</script>
