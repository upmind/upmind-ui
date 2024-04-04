<template>
  <button
    class="btn"
    :class="styles.root"
    type="button"
    :aria-label="ariaLabel"
    :disabled="disabled"
    :data-size="size"
    :data-variant="variant"
    :data-color="color"
    :data-shape="shape"
  >
    <slot v-if="loading" name="loading" v-bind="{ styles: styles.loading }">
      <upw-spinner :class="styles.loading" class="btn-loading" />
    </slot>

    <template v-else>
      <slot name="prepend" v-bind="{ styles: styles.icon, icon: prependIcon }">
        <upw-icon
          v-if="prependIcon"
          :class="styles.icon"
          :name="prependIcon"
          class="btn-icon"
        />
      </slot>

      <slot v-bind="{ styles }">
        <span :class="styles.label" v-if="label" class="btn-label">
          {{ label }}
        </span>
      </slot>

      <slot name="append" v-bind="{ styles: styles.icon, icon: appendIcon }">
        <upw-icon
          v-if="appendIcon"
          :class="styles.icon"
          :name="appendIcon"
          class="btn-icon"
        />
      </slot>
    </template>
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
  inheritAttrs: false,
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
  },

  setup(props) {
    const styles = useStyles("button", config, { props }, [
      "size",
      "variant",
      "color",
      "shape",
      "disabled",
    ]);

    return {
      styles,
    };
  },
  computed: {
    ariaLabel() {
      return this.label || this.$attrs.ariaLabel;
    },
  },
});
</script>
