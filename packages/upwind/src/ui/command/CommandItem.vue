<template>
  <ComboboxItem v-bind="forwarded" :class="styles.command.item">
    <slot />
  </ComboboxItem>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { ComboboxItem, useForwardPropsEmits } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxItem,
  },
  props: {
    disabled: Boolean,
    textValue: String,
    value: [String, Number],
  },
  emits: ["select"],
  setup(props, { emit }) {
    const delegatedProps = computed(() => {
      const { ...delegated } = props;
      return delegated;
    });

    const forwarded = useForwardPropsEmits(delegatedProps, emit);
    const styles = useStyles("command", props, config);

    return { forwarded, styles };
  },
});
</script>
