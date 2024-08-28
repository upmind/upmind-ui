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
import type { PropType } from "vue";
import type { AlertConfig } from "./types";

export default defineComponent({
  name: "UwAlert",
  props: {
    variant: {
      type: String as PropType<AlertConfig["variant"]>,
    },
    color: {
      type: String as PropType<AlertConfig["color"]>,
      default: "base",
    },
    title: {
      type: String,
    },
    description: {
      type: String,
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

<style scoped src="@/assets/main.css" />
