<template>
  <ComboboxEmpty v-bind="delegatedProps" :class="styles.command.empty">
    <slot />
  </ComboboxEmpty>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { ComboboxEmpty } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxEmpty,
  },
  props: {
    as: {
      type: [String, Object],
    },
  },
  setup(props) {
    const delegatedProps = computed(() => {
      const { ...delegated } = props;
      return delegated;
    });

    const styles = useStyles("command", props, config);

    return {
      delegatedProps,
      styles,
    };
  },
});
</script>
