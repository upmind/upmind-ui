<template>
  <div
    class="divide-base-200 border-base-200 flex w-full max-w-md animate-pulse space-y-4 divide-y rounded border p-4 shadow md:p-6"
    role="status"
  >
    <span class="sr-only">Loading List...</span>

    <div class="flex items-center justify-between">
      <div>
        <div class="bg-base-300 mb-2.5 h-2.5 w-24 rounded-full"></div>
        <div class="bg-base-200 h-2 w-32 rounded-full"></div>
      </div>
      <div class="bg-base-300 h-2.5 w-12 rounded-full"></div>
    </div>
    <div class="flex items-center justify-between pt-4">
      <div>
        <div class="bg-base-300 mb-2.5 h-2.5 w-24 rounded-full"></div>
        <div class="bg-base-200 h-2 w-32 rounded-full"></div>
      </div>
      <div class="bg-base-300 h-2.5 w-12 rounded-full"></div>
    </div>
    <div class="flex items-center justify-between pt-4">
      <div>
        <div class="bg-base-300 mb-2.5 h-2.5 w-24 rounded-full"></div>
        <div class="bg-base-200 h-2 w-32 rounded-full"></div>
      </div>
      <div class="bg-base-300 h-2.5 w-12 rounded-full"></div>
    </div>
    <div class="flex items-center justify-between pt-4">
      <div>
        <div class="bg-base-300 mb-2.5 h-2.5 w-24 rounded-full"></div>
        <div class="bg-base-200 h-2 w-32 rounded-full"></div>
      </div>
      <div class="bg-base-300 h-2.5 w-12 rounded-full"></div>
    </div>
    <div class="flex items-center justify-between pt-4">
      <div>
        <div class="bg-base-300 mb-2.5 h-2.5 w-24 rounded-full"></div>
        <div class="bg-base-200 h-2 w-32 rounded-full"></div>
      </div>
      <div class="bg-base-300 h-2.5 w-12 rounded-full"></div>
    </div>
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
  name: "UpwSkeletonList",
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
