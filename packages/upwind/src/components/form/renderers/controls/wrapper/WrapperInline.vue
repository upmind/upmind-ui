<template>
  <div v-if="visible" :id="id" :class="styles.control.root">
    <!-- wrapper -->
    <div
      :class="[
        styles.control.wrapper,
        errors ? styles.control.error.wrapper : null,
      ]"
    >
      <!-- label -->
      <label
        v-if="computedLabel"
        :for="id + '-input'"
        :class="[
          styles.control.label.root,
          errors ? styles.control.error.label : null,
          styles.control.inline,
        ]"
      >
        <slot></slot>

        <span :class="styles.control.label">{{ computedLabel }}</span>
      </label>
    </div>

    <!-- help/description -->
    <div v-if="showDescription" :class="styles.control.description">
      {{ description }}
    </div>

    <!-- errors -->
    <div v-if="errors" :class="styles.control.error.text">
      {{ errors }}
    </div>
  </div>
</template>

<script lang="ts">
import { isDescriptionHidden, computeLabel } from "@jsonforms/core";
import type { PropType } from "vue";
import { defineComponent } from "vue";
import type { Styles } from "../../styles";
import type { Options } from "../../utils";

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
    styles: {
      required: true,
      type: Object as PropType<Styles>,
    },
  },
  computed: {
    showDescription(): boolean {
      return !isDescriptionHidden(
        this.visible,
        this.description,
        this.isFocused,
        !!this.appliedOptions?.persistDescription
      );
    },
    computedLabel(): string {
      return computeLabel(
        this.label,
        this.required,
        !!this.appliedOptions?.hideRequired
      );
    },
  },
});
</script>
