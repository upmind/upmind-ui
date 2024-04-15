<template>
  <button
    :class="styles.root"
    :disabled="disabled"
    :data-size="size"
    :data-variant="variant"
    :data-color="color"
  >
    <slot
      v-if="meta.isLoading"
      name="loading"
      v-bind="{ styles: styles.spinner }"
    >
      <upw-spinner :class="styles.spinner" class="loading" />
    </slot>

    <slot
      name="prepend-avatar"
      v-bind="{ styles: styles.avatar, avatar: prependAvatar }"
      v-if="!iconOnly"
    >
      <upw-icon
        v-if="prependAvatar"
        class="avatar"
        :class="[styles.avatar]"
        :icon="prependAvatar"
      />
    </slot>

    <span class="content" :class="[styles.content]">
      <slot
        name="prepend-icon"
        v-bind="{ styles: styles.icon, icon: prependIcon }"
      >
        <upw-icon v-if="prependIcon" :class="styles.icon" :icon="prependIcon" />
      </slot>

      <slot v-bind="{ styles }">
        <span :class="styles.label" v-if="label" class="label">
          {{ label }}
        </span>
      </slot>

      <slot
        name="append-icon"
        v-bind="{ styles: styles.icon, icon: appendIcon }"
        v-if="!iconOnly || (iconOnly && !prependIcon)"
      >
        <upw-icon v-if="appendIcon" :class="styles.icon" :icon="appendIcon" />
      </slot>
    </span>

    <slot
      name="append-avatar"
      v-bind="{ styles: styles.avatar, avatar: appendAvatar }"
      v-if="!iconOnly"
    >
      <upw-icon
        v-if="appendAvatar"
        class="avatar"
        :class="[styles.avatar]"
        :icon="appendAvatar"
      />
    </slot>
  </button>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { ButtonVariant, ButtonColor, ButtonSize } from "./types";

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
    prependAvatar: {
      type: [String, Object],
      default: null,
    },
    prependIcon: {
      type: [String, Object],
      default: null,
    },
    appendIcon: {
      type: [String, Object],
      default: null,
    },
    appendAvatar: {
      type: [String, Object],
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
    iconOnly: {
      type: Boolean,
      default: false,
    },
    block: {
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
    const styles = useStyles("button", props, config, props.upwindConfig);

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
