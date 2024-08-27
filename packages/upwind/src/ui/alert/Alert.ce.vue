<template>
  <div :class="styles.alert.root" role="alert">
    <div :class="styles.alert.icon">
      <slot name="prepend"></slot>
    </div>
    <div :class="styles.alert.content">
      <h5 v-if="title" :class="styles.alert.title">
        {{ title }}
      </h5>
      <div v-if="description" :class="styles.alert.description">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import config from "./alert.config";

// --- utils
import { useStyles } from "../../utils";

// --- types
import { type AlertVariants } from ".";
import type { IconProps } from "../../icon/types";
import type { PropType } from "vue";

export default defineComponent({
  props: {
    variant: {
      type: String as PropType<AlertVariants["variant"]>,
    },
    color: {
      type: String as PropType<AlertVariants["color"]>,
      default: "base",
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
    },
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const styles = useStyles(
      "alert",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      styles,
    };
  },
});
</script>

<style src="@/assets/main.css" />
