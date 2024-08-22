<template>
  <dialog-description :class="styles.dialog.description" :as-child="asChild">
    <slot />
  </dialog-description>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import { DialogDescription } from "radix-vue";

// --- internal
import config from "./dialog.config";

// --- utils
import { useStyles } from "../../utils";

export default defineComponent({
  components: {
    DialogDescription,
  },
  props: {
    asChild: Boolean,
  },
  setup(props) {
    const styles = useStyles("dialog", toRefs(props), config);

    return {
      styles,
    };
  },
});
</script>
