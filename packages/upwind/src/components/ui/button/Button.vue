<script setup lang="ts">
// ---external
import { Primitive } from "radix-vue";
import { toRefs } from "vue";

// --- internal
import config from "./button.config";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import type { PrimitiveProps } from "radix-vue";
import type { ButtonConfig } from ".";

interface Props extends PrimitiveProps {
  label: string;
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

const styles = useStyles("button", toRefs(props), config, props.upwindConfig);
</script>

<template>
  <primitive :as="as" :as-child="asChild" :class="styles.button.root">
    <slot>
      {{ label }}
    </slot>
  </primitive>
</template>
