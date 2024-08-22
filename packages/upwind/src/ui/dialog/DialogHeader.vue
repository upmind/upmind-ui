<template>
  <div :class="styles.dialog.header">
    <slot />
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import config from "./dialog.config";

// --- utils
import { useStyles } from "../../utils";

export default defineComponent({
  setup(props) {
    const styles = useStyles("dialog", toRefs(props), config);

    return {
      styles,
    };
  },
});
</script>
