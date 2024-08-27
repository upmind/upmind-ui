<template>
  <ComboboxRoot v-bind="forwarded" :class="styles.command.root">
    <slot />
  </ComboboxRoot>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { ComboboxRoot, useForwardPropsEmits } from "radix-vue";

// --- internal
import { config } from ".";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxRoot,
  },
  props: {
    open: { type: Boolean, default: true },
    modelValue: { type: String, default: "" },
  },
  emits: ["update:modelValue", "update:open"],
  setup(props, { emit }) {
    const delegatedProps = computed(() => {
      const { ...delegated } = props;
      return delegated;
    });

    const forwarded = useForwardPropsEmits(delegatedProps, emit);
    const styles = useStyles("command", props, config);

    return {
      forwarded,
      styles,
    };
  },
});
</script>
