<template>
  <ComboboxSeparator v-bind="$props" :class="styles.command.separator">
    <slot />
  </ComboboxSeparator>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { ComboboxSeparator } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxSeparator,
  },
  props: {
    as: { type: [String, Object] },
    asChild: { type: Boolean },
  },
  setup(props) {
    const styles = useStyles("command", props, config);

    return {
      styles,
    };
  },
});
</script>
