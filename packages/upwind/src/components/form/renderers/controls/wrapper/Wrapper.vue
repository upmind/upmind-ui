<template>
  <div v-if="meta.isVisible" :id="id" :class="styles?.root">
    <!-- label -->
    <div
      class="label"
      :class="[
        styles?.label?.root,
        meta.isInvalid ? styles?.label?.error : null,
        meta.isValid ? styles?.label?.success : null,
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
        meta.isInvalid ? styles?.wrapper?.error : null,
        meta.isValid ? styles?.wrapper?.success : null,
        meta.isDisabled ? 'disabled' : null,
      ]"
    >
      <span
        class="prefix"
        :class="[
          styles?.prefix?.root,
          meta.isInvalid ? styles?.prefix?.error : null,
          meta.isValid ? styles?.prefix?.success : null,
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
          meta.isInvalid ? styles?.suffix?.error : null,
          meta.isValid ? styles?.suffix?.success : null,
        ]"
        v-if="appliedOptions?.suffix"
      >
        {{ appliedOptions.suffix }}
      </span>
    </div>

    <!-- feedback -->
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
      <div class="feedback" :class="styles?.feedback?.root">
        <!-- hint/description -->
        <span
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
          :class="[
            styles?.feedback?.error,
            !showError ? styles?.feedback?.hidden : '',
          ]"
        >
          <upw-icon :class="styles?.icon" icon="information-circle" />
          <span>{{ errors }}</span>
        </span>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { isDescriptionHidden, computeLabel } from "@jsonforms/core";

// --- components
import UpwIcon from "../../../../icon/Icon.vue";

// --- local
import config from "./config";

// --- utils
import { useStyles } from "../../../../../utils";

// --- types
import type { PropType } from "vue";
import type { Options } from "../../utils";

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
    meta: {
      required: true,
      type: Object,
      default: undefined,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  computed: {
    showDescription(): boolean {
      return (
        !this.meta.isInvalid &&
        !isDescriptionHidden(
          this.meta?.isVisible,
          this.description,
          this.meta?.isFocused,
          !!this.appliedOptions?.persistDescription
        )
      );
    },
    showError(): boolean {
      return this.meta.isInvalid;
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
