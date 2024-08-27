<template>
  <dialog-title :class="styles.dialog.title">
    <slot />
  </dialog-title>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import { DialogTitle } from "radix-vue";

// --- internal
import config from "./dialog.config";

// --- utils
import { useStyles } from "../../utils";

export default defineComponent({
  components: {
    DialogTitle,
  },
  setup(props) {
    const styles = useStyles("dialog", toRefs(props), config);

    return {
      styles,
    };
  },
});
</script>
