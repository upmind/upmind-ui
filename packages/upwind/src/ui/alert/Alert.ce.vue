<template>
  <link rel="stylesheet" :href="stylesheet" />

  <div :class="styles.alert.root" role="alert">
    <uw-icon :icon="icon" :class="styles.alert.icon" />
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
import { useStyles, stylesheet } from "../../utils";

// --- components
import UwIcon from "../../ui/icon/Icon.ce.vue";

// --- utils

// --- types
import type { PropType } from "vue";
import type { AlertConfig } from "./types";

export default defineComponent({
  name: "UwAlert",

  components: {
    UwIcon,
  },

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
      stylesheet,
      styles,
    };
  },
});
</script>
