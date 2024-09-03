<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-disabled="disabled"
    :aria-selected="selected"
    @click="disabled ? null : $emit('update:modelValue', hash)"
    :class="styles.step.root"
    replace
  >
    <upw-spinner v-if="loading" size="xs" :class="styles.step.loading" />

    <uw-avatar
      v-else
      :avatar="complete ? 'check-circle' : { caption }"
      size="xs"
      :class="styles.step.avatar"
    />

    <span :class="styles.step.label">{{ label }}</span>
  </button>
</template>

<script>
// --- external
import { defineComponent, toRefs } from "vue";

// -- components
import UwAvatar from "../../ui/avatar/Avatar.ce.vue";
import UpwButton from "../button/Button.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- local
import config from "./config.cva";

// ---utils
import { useStyles } from "../../utils";

// ----------------------------------------------------------------------------
export default defineComponent({
  name: "UpwStep",
  components: { UwAvatar, UpwButton, UpwSpinner },
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
    upwindConfig: {
      type: Object,
      default: null,
    },
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
