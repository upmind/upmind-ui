<template>
  <div
    class="spinner"
    :class="styles.spinner.root"
    role="status"
    aria-label="animated loading icon"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script lang="ts">
// -- global
import { defineComponent, toRefs } from "vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";

// ----------------------------------------------

export default defineComponent({
  name: "UpwSpinner",
  props: {
    size: {
      type: String,
      default: "md",
      validator: (value: string) =>
        ["auto", "xs", "sm", "md", "lg", "xl", "2xl"].includes(value),
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const styles = useStyles(
      "spinner",
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
