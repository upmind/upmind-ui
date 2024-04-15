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

<script>
// -- global
import { defineComponent } from "vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";

// ----------------------------------------------

export default defineComponent({
  name: "UpwSpinner",
  props: {
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const { styles } = useStyles("spinner", props, config, props.upwindConfig);

    return {
      styles,
    };
  },
});
</script>
