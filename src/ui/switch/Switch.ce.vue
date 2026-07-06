<template>
  <Switch v-bind="forwarded" :class="cn(styles.switch, props.class)" />
</template>

<script lang="ts" setup>
import { type SwitchRootEmits, useForwardPropsEmits } from "radix-vue";
import { computed } from "vue";
import config from "./switch.config";
import Switch from "./Switch.vue";

// --- internal
import { useStyles, cn, useDisabled } from "../../utils";

// --- utils
import { assign, omit } from "lodash-es";

// --- types
import type { SwitchProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SwitchProps>(), {
  uiConfig: () => ({ input: [] }),
  class: ""
});

const emits = defineEmits<SwitchRootEmits>();

const disabled = useDisabled(() => props.disabled);

const delegatedProps = computed(() =>
  assign(omit(props, ["class", "uiConfig"]), { disabled: disabled.value })
);

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const styles = useStyles(["switch"], {}, config, props.uiConfig ?? {});
</script>
