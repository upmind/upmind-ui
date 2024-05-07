<template>
  <!-- <div
    class="spinner"
    :class="styles.spinner.root"
    role="status"
    aria-label="animated loading icon"
  >
    <span class="sr-only">Loading...</span>
  </div> -->

  <div class="flex w-full animate-pulse" role="status">
    <span class="sr-only">Loading Form...</span>

    <ul class="m-0 w-full list-none space-y-4 p-0">
      <li class="bg-base-200 m-0 h-12 w-1/2 rounded-lg p-0"></li>
      <li class="bg-base-200 m-0 h-12 w-2/3 rounded-lg p-0"></li>
      <li class="bg-base-200 m-0 h-12 w-1/2 rounded-lg p-0"></li>
      <li class="bg-base-200 m-0 h-24 w-full rounded-lg p-0"></li>
    </ul>
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
  name: "UpwSkeletonForm",
  props: {
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const styles = useStyles("skeleton", props, config, props.upwindConfig);

    return {
      styles,
    };
  },
});
</script>
