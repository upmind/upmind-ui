<template>
  <Button
    type="button"
    :disabled="disabled"
    :aria-disabled="disabled"
    :aria-selected="selected"
    @click="disabled ? null : $emit('update:modelValue', hash)"
    :class="styles.step.root"
    replace
  >
    <Spinner v-if="loading" size="xs" :class="styles.step.loading" />

    <Avatar
      v-else
      :icon="complete ? 'check-circle' : null"
      :caption="caption"
      size="xs"
      :class="styles.step.avatar"
    />

    <span :class="styles.step.label">{{ label }}</span>
  </Button>
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";

// -- components
import Avatar from "../../ui/avatar/Avatar.ce.vue";
import Button from "../../ui/button/Button.ce.vue";
import Spinner from "../../ui/spinner/Spinner.ce.vue";

// --- local
import config from "./config.cva";

// ---utils
import { useStyles } from "../../utils";

// ----------------------------------------------------------------------------
export default defineComponent({
  name: "UwpwStep",
  components: { Avatar, Button, Spinner },
  emits: ["update:modelValue"],
  props: {
    modelValue: { type: Boolean },
    hash: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: null,
    },
    // ---
    selected: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    complete: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },
  setup(props) {
    const styles = useStyles("step", toRefs(props), config, props.upwindConfig);

    return {
      styles,
      config,
    };
  },
});
</script>
