<template>
  <button
    :class="styles.root"
    :disabled="disabled"
    :data-size="size"
    :data-variant="variant"
    :data-color="color"
    :data-shape="shape"
  >
    <slot
      v-if="meta.isLoading"
      name="loading"
      v-bind="{ styles: styles.loading }"
    >
      <upw-spinner :class="styles.loading" class="loading" />
    </slot>

    <slot name="prepend" v-bind="{ styles: styles.icon, icon: prependIcon }">
      <upw-icon
        v-if="prependIcon"
        :class="[styles.icon.root, meta.isLoading ? styles.icon.loading : '']"
        :icon="prependIcon"
      />
    </slot>

    <slot v-bind="{ styles }">
      <span
        :class="[styles.label.root, meta.isLoading ? styles.label.loading : '']"
        v-if="label"
        class="label"
      >
        {{ label }}
      </span>
    </slot>

    <slot name="append" v-bind="{ styles: styles.icon, icon: appendIcon }">
      <upw-icon
        v-if="appendIcon"
        :class="[styles.icon.root, meta.isLoading ? styles.icon.loading : '']"
        :icon="appendIcon"
      />
    </slot>
  </button>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";

// --- local
import config from "./config";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type {
  ButtonVariant,
  ButtonColor,
  ButtonShape,
  ButtonSize,
} from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwButton",
  components: {
    UpwIcon,
    UpwSpinner,
  },

  props: {
    label: {
      type: String,
      default: null,
    },
    prependIcon: {
      type: String,
      default: null,
    },
    appendIcon: {
      type: String,
      default: null,
    },

    // ---
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // ---
    variant: {
      type: String as PropType<ButtonVariant>,
      default: null,
    },
    color: {
      type: String as PropType<ButtonColor>,
      default: null,
    },
    size: {
      type: String as PropType<ButtonSize>,
      default: null,
    },
    shape: {
      type: String as PropType<ButtonShape>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const styles = useStyles("button", { props }, config, props.upwindConfig);

    return {
      styles,
    };
  },

  computed: {
    meta() {
      return {
        isLoading: this.loading,
      };
    },
  },
});
</script>
