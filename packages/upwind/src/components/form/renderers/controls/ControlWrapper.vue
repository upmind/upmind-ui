<template>
  <div v-if="meta.isVisible" :id="id" :class="styles?.root">
    <!-- label -->
    <label
      v-if="computedLabel"
      :for="id + '-input'"
      :class="[
        styles?.label?.root,
        meta.isInvalid ? styles?.label?.error : null,
        meta.isValid ? styles?.label?.success : null,
      ]"
    >
      <span :class="styles?.label?.text">{{ computedLabel }}</span>
    </label>

    <!-- wrapper -->
    <div
      :class="[
        styles?.wrapper?.root,
        meta.isInvalid ? styles?.wrapper?.error : null,
        meta.isValid ? styles?.wrapper?.success : null,
        meta.isDisabled ? 'disabled' : null,
      ]"
    >
      <slot name="prepend">
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
      </slot>

      <slot
        name="prepend-avatar"
        v-bind="{
          styles: styles?.avatar,
          avatar: appliedOptions?.prependAvatar,
        }"
      >
        <upw-icon
          v-if="appliedOptions?.prependAvatar"
          class="avatar"
          :class="styles?.avatar"
          :icon="appliedOptions.prependAvatar"
        />
      </slot>

      <slot
        name="prepend-icon"
        v-bind="{
          styles: styles?.icon,
          icon: appliedOptions?.prependIcon,
        }"
      >
        <upw-icon
          v-if="appliedOptions?.prependIcon"
          :class="styles?.icon"
          :icon="appliedOptions.prependIcon"
        />
      </slot>

      <slot></slot>

      <slot
        name="status"
        v-bind="{
          styles: styles?.status,
          errors,
          meta,
        }"
      >
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
      </slot>

      <slot
        name="append-icon"
        v-bind="{ styles: styles?.icon, icon: appliedOptions?.appendIcon }"
      >
        <upw-icon
          v-if="appliedOptions?.appendIcon"
          :class="styles?.icon"
          :icon="appliedOptions.appendIcon"
        />
      </slot>

      <slot
        name="append-avatar"
        v-bind="{
          styles: styles?.avatar,
          avatar: appliedOptions?.appendAvatar,
        }"
      >
        <upw-icon
          v-if="appliedOptions?.appendAvatar"
          class="avatar"
          :class="styles?.avatar"
          :icon="appliedOptions.appendAvatar"
        />
      </slot>

      <slot name="append">
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
      </slot>
    </div>

    <!-- help/description -->
    <div v-if="showDescription" :class="styles?.description">
      <upw-icon :class="styles?.icon" icon="information-circle" />
      <span>{{ description }}</span>
    </div>

    <!-- errors -->
    <div v-if="showError" :class="styles?.error">
      <upw-icon :class="styles?.icon" icon="information-circle" />
      <span>{{ errors }}</span>
    </div>
  </div>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { isDescriptionHidden, computeLabel } from "@jsonforms/core";

// --- components
import UpwIcon from "../../../icon/Icon.vue";

// --- local

// --- utils
import { useStyles } from "../../../../utils";

// --- types
import type { PropType } from "vue";
import type { Options } from "../utils";

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
      return !isDescriptionHidden(
        this.meta?.isVisible,
        this.description,
        this.meta?.isFocused,
        !!this.appliedOptions?.showUnfocusedDescription
      );
    },
    showError(): boolean {
      return (
        this.meta.isInvalid &&
        isDescriptionHidden(
          this.meta?.isVisible,
          this.description,
          this.meta?.isFocused,
          !!this.appliedOptions?.showUnfocusedDescription
        )
      );
    },
    computedLabel(): string {
      return computeLabel(
        this.label,
        this.meta?.isRequired,
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
