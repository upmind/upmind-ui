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
    <slot v-bind="{ styles }">
      <slot v-if="loading" name="loading" v-bind="{ styles: styles.loading }">
        <upw-spinner :class="styles.loading" class="btn-loading" />
      </slot>

      <template v-else>
        <slot name="icon" v-bind="{ styles: styles.icon }">
          <upw-icon
            v-if="icon"
            :class="styles.icon"
            :name="icon"
            class="btn-icon"
          />
        </slot>

        <span :class="styles.label" v-if="label" class="btn-label">{{
          label
        }}</span>
      </template>
    </slot>
  </button>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";

import type {
  ButtonVariant,
  ButtonColor,
  ButtonShape,
  ButtonSize,
} from "./styles";

import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

import UseStyles from "./styles";

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
    icon: {
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
    const styles = UseStyles({ props });

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
