<template>
  <span :class="styles.title">
    <h3 v-if="meta.isString">{{ title }}</h3>

    <h3
      v-if="meta.isMask"
      v-html="
        template(title.text)({
          mask: `<mask class='bg-${props.color}'>${title.mask}</mask>`,
        })
      "
    />

    <h3
      v-if="meta.isBold"
      v-html="
        template(title.text)({
          bold: `<b>${title.bold}</b>`,
        })
      "
    />
  </span>
</template>

<script setup lang="ts">
// --- external
import { isString, template } from "lodash-es";
import { computed } from "vue";
// --- internal
import config from "./config.cva";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { SmartTitleProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SmartTitleProps>(), {
  color: "secondary",
});

const meta = computed(() => {
  const variant = getVariant();
  return {
    variant,
    isString: variant === "default",
    isMask: variant === "mask",
    isBold: variant === "bold",
  };
});

const getVariant = () => {
  if (isString(props.title)) return "default";
  if (props.title?.mask) return "mask";
  if (props.title?.bold) return "bold";
};

const styles = useStyles(["title"], meta, config, {}) as ComputedRef<{
  title: string;
}>;
</script>
