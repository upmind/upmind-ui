<script setup lang="ts">
// ---external
import { Primitive } from "radix-vue";
import { computed } from "vue";

// --- internal
import config from "./button.config";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import type { PrimitiveProps } from "radix-vue";
import type { ButtonConfig } from ".";
import type { HTMLAttributes } from "vue";

interface Props extends PrimitiveProps {
  label: string;
  class: HTMLAttributes["class"];
  color: ButtonConfig["color"];
  variant?: ButtonConfig["variant"];
  size?: ButtonConfig["size"];
  upwindConfig?: ButtonConfig;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
  upwindConfig: {},
});

const styles = useStyles("button", props, config, props.upwindConfig);

const mergedClasses = computed(() => {
  return [styles.value.button.root, props.class];
});
</script>

<template>
  <primitive :as="as" :as-child="asChild" :class="mergedClasses">
    <slot>
      {{ label }}
    </slot>
  </primitive>
</template>
