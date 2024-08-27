<template>
  <div :class="styles.alert.root" role="alert">
    <slot />
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- internal
import config from "./alert.config";

// --- utils
import { useStyles } from "../../../utils";

//--- types
import { type AlertVariants } from ".";
import type { PropType } from "vue";

export default defineComponent({
  props: {
    variant: {
      type: String as PropType<AlertVariants["variant"]>,
    },
    color: {
      type: String as PropType<AlertVariants["color"]>,
      default: "base",
    },
  },

  setup(props) {
    const styles = useStyles("alert", toRefs(props), config);

    return {
      styles,
    };
  },
});
</script>
