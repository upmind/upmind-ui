<template>
  <ComboboxGroup v-bind="delegatedProps" :class="styles.command.group">
    <ComboboxLabel v-if="heading" :class="styles.command.label">
      {{ heading }}
    </ComboboxLabel>
    <slot />
  </ComboboxGroup>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { ComboboxGroup, ComboboxLabel } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxGroup,
    ComboboxLabel,
  },
  props: {
    heading: String,
    asChild: Boolean,
  },
  setup(props) {
    const delegatedProps = computed(() => {
      const { heading, ...delegated } = props;
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
