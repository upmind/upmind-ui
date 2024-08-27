<template>
  <div :class="styles.command.input.wrapper" cmdk-input-wrapper>
    <UpwIcon icon="search" :class="styles.command.input.icon" />
    <ComboboxInput
      v-bind="{ ...forwardedProps, ...attrs }"
      auto-focus
      :class="styles.command.input.root"
    />
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { ComboboxInput, useForwardProps } from "radix-vue";

// --- internal
import { config } from ".";

// --- components
import UpwIcon from "../../icon/Icon.vue";

// --- utils
import { useStyles } from "../../../utils";

export default defineComponent({
  components: {
    ComboboxInput,
    UpwIcon,
  },
  props: {
    modelValue: String,
    disabled: Boolean,
    required: Boolean,
    placeholder: String,
    name: String,
    autoComplete: String,
    autoFocus: Boolean,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs }) {
    const delegatedProps = computed(() => {
      const { class: _, ...delegated } = props;
      return delegated;
    });

    const forwardedProps = useForwardProps(delegatedProps);
    const styles = useStyles("command.input", props, config);
    console.log(styles);

    return {
      forwardedProps,
      attrs,
      styles,
    };
  },
});
</script>
