<template>
  <div v-if="visible" :id="id" :class="styles?.root">
    <!-- label -->
    <label
      v-if="computedLabel"
      :for="id + '-input'"
      :class="[styles?.label?.root, errors ? styles?.label?.error : null]"
    >
      <span :class="styles?.label?.text">{{ computedLabel }}</span>
    </label>

    <!-- wrapper -->
    <div
      :class="[
        styles?.wrapper?.root,
        errors ? styles?.wrapper?.error : null,
        disabled ? 'disabled' : null,
      ]"
    >
      <slot name="append">
        <span
          class="prefix"
          :class="[styles?.prefix.root, errors ? styles?.prefix.error : null]"
          v-if="appliedOptions?.prefix"
        >
          {{ appliedOptions.prefix }}
        </span>
      </slot>

      <slot></slot>

      <slot name="append">
        <span
          class="suffix"
          :class="[styles?.suffix.root, errors ? styles?.suffix.error : null]"
          v-if="appliedOptions?.suffix"
        >
          {{ appliedOptions.suffix }}
        </span>
      </slot>
    </div>

    <!-- help/description -->
    <div v-if="showDescription" :class="styles?.description">
      {{ description }}
    </div>

    <!-- errors -->
    <div v-if="errors" :class="styles?.error">
      {{ errors }}
    </div>
  </div>
</template>

<script lang="ts">
import { isDescriptionHidden, computeLabel } from "@jsonforms/core";
import type { PropType } from "vue";
import { defineComponent } from "vue";
import { useStyles } from "../../../../utils";
import type { Options } from "../utils";

export default defineComponent({
  name: "ControlWrapper",
  props: {
    id: {
      required: true,
      type: String,
    },
    description: {
      required: false as const,
      type: String,
      default: undefined,
    },
    errors: {
      required: false as const,
      type: String,
      default: undefined,
    },
    label: {
      required: false as const,
      type: String,
      default: undefined,
    },
    appliedOptions: {
      required: false as const,
      type: Object as PropType<Options>,
      default: undefined,
    },
    visible: {
      required: false as const,
      type: Boolean,
      default: true,
    },
    disabled: {
      required: false as const,
      type: Boolean,
      default: false,
    },
    required: {
      required: false as const,
      type: Boolean,
      default: false,
    },
    isFocused: {
      required: false as const,
      type: Boolean,
      default: false,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  computed: {
    showDescription(): boolean {
      return !isDescriptionHidden(
        this.visible,
        this.description,
        this.isFocused,
        !!this.appliedOptions?.showUnfocusedDescription
      );
    },
    computedLabel(): string {
      return computeLabel(
        this.label,
        this.required,
        !!this.appliedOptions?.hideRequiredAsterisk
      );
    },
  },
  setup(props) {
    const styles = useStyles("form", { props }, props.upwindConfig);
    return {
      styles,
    };
  },
});
</script>
../utils
