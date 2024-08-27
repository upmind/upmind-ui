<template>
  <span :class="styles.command.shortcut">
    <slot />
  </span>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  setup() {
    const styles = useStyles("command", {}, config);

    return {
      styles,
    };
  },
});
</script>
