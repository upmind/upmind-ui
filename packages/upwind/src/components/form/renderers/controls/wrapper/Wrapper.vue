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

      <span
        v-if="meta.showAsRequired"
        :class="styles.inputControlLabel.required"
      >
        {{ computedRequired }}
      </span>

      <span
        v-else-if="meta.showAsOptional"
        :class="styles.inputControlLabel.optional"
      >
        {{ computedOptional }}
      </span>
    </div>

    <!-- wrapper -->
    <div :class="styles.inputControl.wrapper">
      <span
        class="prefix"
        :class="styles.inputControl.prefix"
        v-if="appliedOptions.prefix"
      >
        {{ appliedOptions.prefix }}
      </span>

      <upw-icon
        v-if="appliedOptions.prependAvatar"
        class="avatar"
        :class="styles.inputControl.avatar"
        :icon="appliedOptions.prependAvatar"
      />

      <upw-icon
        v-if="appliedOptions.prependIcon"
        :class="styles.inputControl.icon"
        :icon="appliedOptions.prependIcon"
      />

      <slot></slot>

      <upw-icon
        v-if="meta.isInvalid"
        :class="styles.inputControl.status"
        icon="alert-circle"
      />
      <upw-icon
        v-else-if="meta.isValid"
        :class="styles.inputControl.status"
        icon="check-circle"
      />

      <upw-icon
        v-if="appliedOptions.appendIcon"
        :class="styles.inputControl.icon"
        :icon="appliedOptions.appendIcon"
      />

      <upw-icon
        v-if="appliedOptions.appendAvatar"
        class="avatar"
        :class="styles.inputControl.avatar"
        :icon="appliedOptions.appendAvatar"
      />

      <span
        class="suffix"
        :class="styles.inputControl.suffix"
        v-if="appliedOptions.suffix"
      >
        {{ appliedOptions.suffix }}
      </span>
    </div>

    <!-- feedback -->
    <div class="feedback" :class="styles.inputControl.feedback">
      <upw-icon key="icon" :class="styles.icon" icon="information-circle" />
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
import type { Options } from "../../utils";
import type { InputSize } from "../types";

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
      default: undefined,
    },
    errors: {
      type: String,
      default: () => [],
    },
    label: {
      type: String,
      default: undefined,
    },
    appliedOptions: {
      type: Object as PropType<Options>,
      default: undefined,
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
    // ---  Additional Attributes
    size: {
      type: String as PropType<InputSize>,
      default: "sm",
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  computed: {
    computedRequired(): string {
      return this.appliedOptions.requiredText || "Required" || "*";
    },

    computedOptional(): string {
      return this.appliedOptions.optionalText || "";
    },
  },
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
          (props.focused || props?.appliedOptions?.persistDescription)) ||
        !isEmpty(props.errors),

      showAsRequired: props.required && !props?.appliedOptions?.hideRequired,
      showAsOptional: !props.required && !props?.appliedOptions?.hideRequired,
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
