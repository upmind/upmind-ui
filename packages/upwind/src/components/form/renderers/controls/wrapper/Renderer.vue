<template>
  <div v-if="meta.isVisible" :id="id" :class="styles.inputControl.root">
    <!-- label -->
    <div class="label" :class="styles.inputControlLabel.root">
      <label
        v-if="label"
        :for="id + '-input'"
        :class="styles.inputControlLabel.text"
      >
        {{ label }}
      </label>

      <span class="status" :class="styles.inputControlLabel.status">
        <span
          v-if="meta.showAsRequired"
          :class="styles.inputControlLabel.required"
        >
          {{ requiredText }}
        </span>

        <span
          v-else-if="meta.showAsOptional"
          :class="styles.inputControlLabel.optional"
        >
          {{ optionalText }}
        </span>

        <upw-icon
          v-if="meta.isInvalid"
          :class="styles.inputControlLabel.icon"
          icon="alert-circle"
        />
        <upw-icon
          v-else-if="meta.isValid"
          :class="styles.inputControlLabel.icon"
          icon="check-circle"
        />
      </span>
    </div>

    <!-- wrapper -->
    <div :class="styles.inputControl.wrapper">
      <slot
        name="prepend"
        v-bind="{
          meta,
          styles: styles.inputControl,
          prependIcon,
          prependAvatar,
          prefix,
        }"
      >
        <span class="prefix" :class="styles.inputControl.prefix" v-if="prefix">
          {{ prefix }}
        </span>

        <upw-icon
          v-if="prependAvatar"
          class="avatar"
          :class="styles.inputControl.avatar"
          :icon="prependAvatar"
        />

        <upw-icon
          v-if="prependIcon"
          :class="styles.inputControl.icon"
          :icon="prependIcon"
        />
      </slot>

      <slot v-bind="{ meta, styles: styles.inputControl }"></slot>

      <slot
        name="append"
        v-bind="{
          meta,
          styles: styles.inputControl,
          appendIcon,
          appendAvatar,
          suffix,
        }"
      >
        <upw-icon
          v-if="appendIcon"
          :class="styles.inputControl.icon"
          :icon="appendIcon"
        />

        <upw-icon
          v-if="appendAvatar"
          class="avatar"
          :class="styles.inputControl.avatar"
          :icon="appendAvatar"
        />

        <span class="suffix" :class="styles.inputControl.suffix" v-if="suffix">
          {{ suffix }}
        </span>
      </slot>
    </div>

    <!-- feedback -->
    <div class="feedback" :class="styles.inputControl.feedback">
      <upw-icon
        key="icon"
        :class="styles.inputControl.feedbackIcon"
        icon="information-circle"
      />
      <span key="details">{{ errors || description }}</span>
    </div>
  </div>
</template>

<script lang="ts">
// --- global
import { defineComponent, computed } from "vue";

// --- components
import UpwIcon from "../../../../icon/Icon.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../../../../utils";
import { isNil, isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps } from "../types";

export default defineComponent({
  name: "ControlWrapper",
  components: {
    UpwIcon,
  },
  props: {
    id: {
      required: true,
      type: String,
    },
    description: {
      type: String,
      default: null,
    },
    errors: {
      type: String,
      default: () => [],
    },
    label: {
      type: String,
      default: null,
    },
    // --- Applied Options
    appendAvatar: {
      type: [Object, String],
      default: null,
    },
    appendIcon: {
      type: [Object, String],
      default: null,
    },
    prependAvatar: {},
    prependIcon: {
      type: [Object, String],
      default: null,
    },

    hideRequired: {
      type: Boolean,
      default: false,
    },
    optionalText: {
      type: String,
      default: "",
    },
    persistDescription: {
      type: Boolean,
      default: true,
    },
    prefix: {
      type: String,
      default: null,
    },

    requiredText: {
      type: String,
      default: "Required",
    },
    suffix: {
      type: String,
      default: null,
    },
    size: {
      type: String as PropType<InputProps["size"]>,
      default: "md",
    },

    // ---
    required: {
      type: Boolean,
      default: false,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    focused: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    data: {
      type: [String, Number, Boolean, Object, Array],
      default: null,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  computed: {},
  setup(props) {
    const meta = computed(() => ({
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.data),
      isDirty: !isNil(props.data),
      isFocused: props.focused,
      isRequired: props.required,
      isVisible: props.visible,
      isDisabled: props.disabled,
      hasFeedback:
        (isEmpty(props.errors) &&
          !isNil(props.description) &&
          (props.focused || props.persistDescription)) ||
        !isEmpty(props.errors),

      showAsRequired: props.required && !props.hideRequired,
      showAsOptional:
        !props.required && !props.hideRequired && !isEmpty(props.optionalText),
    }));

    const styles = useStyles(
      ["inputControl", "inputControlLabel"],
      meta,
      config,
      props.upwindConfig
    );

    return {
      meta,
      styles,
    };
  },
});
</script>
