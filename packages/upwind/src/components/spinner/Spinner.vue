<template>
  <div
    class="spinner"
    :class="styles.root"
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
import config from "./config";

// --- utils
import { useStyles } from "../../utils";

// ----------------------------------------------

export default defineComponent({
  name: "UpwSpinner",
  setup() {
    const styles = useStyles("spinner", config);

    return {
      styles,
    };
  },
});
</script>
