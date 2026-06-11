<template>
  <Switch v-bind="forwarded" :class="cn(styles.switch, props.class)" />
</template>

<script lang="ts" setup>
import { type SwitchRootEmits, useForwardPropsEmits } from "radix-vue";
import { computed } from "vue";
import config from "./switch.config";
import Switch from "./Switch.vue";
import { useStyles, cn } from "../../utils";
import { omit } from "lodash-es";
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
