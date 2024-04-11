<template>
  <div v-if="meta.isVisible" :id="id" :class="[styles?.root]">
    <!-- label -->
    <div
      class="label"
      :class="[
        styles?.label?.root,
        showError ? styles?.label?.error : null,
        showSuccess ? styles?.label?.success : null,
      ]"
    >
      <label
        v-if="computedLabel"
        :for="id + '-input'"
        :class="[styles?.label?.text]"
      >
        {{ computedLabel }}
      </label>

      <span v-if="showAsRequired" :class="[styles?.label?.required]">
        {{ computedRequired }}
      </span>

      <span v-else-if="showAsOptional" :class="[styles?.label?.optional]">
        {{ computedOptional }}
      </span>
    </div>

    <!-- wrapper -->
    <div
      :class="[
        styles?.wrapper?.root,
        showError ? styles?.wrapper?.error : null,
        showSuccess ? styles?.wrapper?.success : null,
        meta.isDisabled ? styles?.wrapper?.disabled : '',
      ]"
    >
      <span
        class="prefix"
        :class="[
          styles?.prefix?.root,
          showError ? styles?.prefix?.error : null,
          showSuccess ? styles?.prefix?.success : null,
        ]"
        v-if="appliedOptions?.prefix"
      >
        {{ appliedOptions.prefix }}
      </span>

      <upw-icon
        v-if="appliedOptions?.prependAvatar"
        class="avatar"
        :class="styles?.avatar"
        :icon="appliedOptions.prependAvatar"
      />

      <upw-icon
        v-if="appliedOptions?.prependIcon"
        :class="styles?.icon"
        :icon="appliedOptions.prependIcon"
      />

      <slot></slot>

      <upw-icon
        v-if="meta.isInvalid"
        :class="[styles?.icon, styles?.status?.error]"
        icon="alert-circle"
      />
      <upw-icon
        v-else-if="meta.isValid"
        :class="[styles?.icon, styles?.status?.success]"
        icon="check-circle"
      />

      <upw-icon
        v-if="appliedOptions?.appendIcon"
        :class="styles?.icon"
        :icon="appliedOptions.appendIcon"
      />

      <upw-icon
        v-if="appliedOptions?.appendAvatar"
        class="avatar"
        :class="styles?.avatar"
        :icon="appliedOptions.appendAvatar"
      />

      <span
        class="suffix"
        :class="[
          styles?.suffix?.root,
          showError ? styles?.suffix?.error : null,
          showSuccess ? styles?.suffix?.success : null,
        ]"
        v-if="appliedOptions?.suffix"
      >
        {{ appliedOptions.suffix }}
      </span>
    </div>

    <!-- feedback -->
    <div class="feedback" :class="styles?.feedback?.root">
      <transition-group
        :enter-active-class="
          styles?.feedback?.transition?.enter?.active?.join(' ')
        "
        :enter-from-class="styles?.feedback?.transition?.enter?.from?.join(' ')"
        :enter-to-class="styles?.feedback?.transition?.enter?.to?.join(' ')"
        :leave-active-class="
          styles?.feedback?.transition?.leave?.active?.join(' ')
        "
        :leave-from-class="styles?.feedback?.transition?.leave?.from?.join(' ')"
        :leave-to-class="styles?.feedback?.transition?.leave?.to?.join(' ')"
      >
        <!-- hint/description -->
        <span
          key="description"
          :class="[
            styles?.feedback?.description,
            !showDescription ? styles?.feedback?.hidden : '',
          ]"
        >
          <upw-icon :class="styles?.icon" icon="information-circle" />
          <span>{{ description }}</span>
        </span>

        <!-- errors -->
        <span
          key="errors"
          :class="[
            styles?.feedback?.error,
            !showError ? styles?.feedback?.hidden : '',
          ]"
        >
          <upw-icon :class="styles?.icon" icon="information-circle" />
          <span>{{ errors }}</span>
        </span>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";

// --- components
import UpwIcon from "../../../../icon/Icon.vue";

// --- local
import config from "./config";

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
      default: undefined,
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
    meta(): any {
      return {
        isInvalid: !!this.errors?.length,
        isValid: isEmpty(this.errors) && !isNil(this.data),
        isDirty: !isNil(this.data),
        isFocused: this.focused,
        isRequired: this.required,
        isVisible: this.visible,
        isDisabled: this.disabled,
      };
    },

    showDescription(): boolean {
      return (
        !isNil(this?.description) &&
        !this.meta?.isInvalid &&
        (this.meta?.isFocused || this.appliedOptions?.persistDescription)
      );
    },
    showError(): boolean {
      return this.meta.isInvalid;
    },
    showSuccess(): boolean {
      return this.meta.isValid;
      // TODO: make this show only for a specified period, ie not persist
    },

    showAsRequired(): boolean {
      return this.meta?.isRequired && !this.appliedOptions?.hideRequired;
    },

    showAsOptional(): boolean {
      return !this.meta?.isRequired && !this.appliedOptions?.hideRequired;
    },

    computedLabel(): string {
      return this.label;

      // return computeLabel(
      //   this.label,
      //   this.meta?.isRequired,
      //   !!this.appliedOptions?.hideRequired
      // );
    },

    computedRequired(): string {
      return this.appliedOptions?.requiredText || "Required";
    },

    computedOptional(): string {
      return this.appliedOptions?.optionalText || "";
    },
  },
  setup(props) {
    const styles = useStyles("form", { props }, config, props.upwindConfig);
    return {
      styles,
    };
  },
});
</script>
