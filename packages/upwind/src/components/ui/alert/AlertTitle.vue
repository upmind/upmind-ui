<template>
  <h5 :class="styles.alert.title">
    <slot />
  </h5>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import config from "./alert.config";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  setup() {
    const styles = useStyles("alert", {}, config);

    return {
      styles,
    };
  },
});
</script>
