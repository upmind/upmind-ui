<template>
  <link rel="stylesheet" :href="globalStyles" />

  <div :class="styles.alert.root" role="alert">
    <upw-icon :icon="icon" :class="styles.alert.icon" />
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
import globalStyles from "@/assets/upwind.css?url"; // ASSETS
import config from "./alert.config";
import { useStyles } from "../../utils";

// --- components
import UpwIcon from "../../ui/icon/Icon.ce.vue";

// --- utils

// --- types
import type { PropType } from "vue";
import type { AlertConfig } from "./types";

export default defineComponent({
  name: "UpwAlert",

  components: {
    UpwIcon,
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
      globalStyles,
      styles,
    };
  },
});
</script>
