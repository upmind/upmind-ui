<template>
  <div v-if="meta.isVisible" :class="styles.inputControl.root">
    <!-- label -->
    <upw-label
      :id="id"
      :label="label"
      :requiredText="requiredText"
      :optionalText="optionalText"
      :hideRequired="hideRequired"
      :hideStatus="hideStatus"
      :required="meta.isRequired"
      :dirty="meta.isDirty"
      :invalid="meta.isInvalid"
      :disabled="meta.isDisabled"
      :size="size"
      :upwindConfig="[config, upwindConfig]"
    />

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
import UpwLabel from "../../../../label/Label.vue";

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
    UpwLabel,
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
      type: [String, Array],
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

    hideStatus: {
      type: Boolean,
      default: false,
    },

    requiredText: {
      type: String,
      default: "Required",
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
    dirty: {
      type: Boolean,
      default: null,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props) {
    const meta = computed(() => ({
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && props.dirty,
      isDirty: props.dirty,
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
      ["inputControl", "label"],
      meta,
      config,
      props.upwindConfig
    );

    return {
      meta,
      config,
      styles,
    };
  },
  computed: {},
});
</script>
