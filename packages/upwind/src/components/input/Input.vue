<template>
  <div v-if="meta.isVisible" :class="styles.input.root">
    <!-- conditionally add our label for non inline inputs -->
    <upw-label
      v-if="!meta.isInline"
      :id="id"
      :text="label"
      :requiredText="requiredText"
      :optionalText="optionalText"
      :noRequired="noRequired"
      :noStatus="noStatus"
      :noLabel="noLabel"
      :required="meta.isRequired"
      :dirty="meta.isDirty"
      :invalid="meta.isInvalid"
      :disabled="meta.isDisabled"
      :size="size"
      :upwindConfig="[config, upwindConfig]"
    />

    <!-- input wrapper -->
    <div :class="styles.input.wrapper">
      <!-- prepend slot-->
      <slot
        name="prepend"
        v-bind="{
          meta,
          styles: styles.input,
          prependIcon,
          prependAvatar,
          prependText,
          size,
        }"
      >
        <span
          class="prependText"
          :class="styles.input.prepend"
          v-if="prependText"
        >
          {{ prependText }}
        </span>

        <upw-icon
          v-if="prependAvatar"
          class="avatar"
          :class="styles.input.avatar"
          :icon="prependAvatar"
        />

        <upw-icon
          v-if="prependIcon"
          :class="styles.input.icon"
          :icon="prependIcon"
        />
      </slot>

      <!-- main slot where actual input gets injected -->
      <slot v-bind="{ meta, styles: styles.input, size }"></slot>

      <!-- conditionally add our label for inline inputs -->
      <upw-label
        v-if="meta.isInline"
        :id="id"
        :text="label"
        :requiredText="requiredText"
        :optionalText="optionalText"
        :noRequired="noRequired"
        :noStatus="noStatus"
        :required="meta.isRequired"
        :dirty="meta.isDirty"
        :invalid="meta.isInvalid"
        :disabled="meta.isDisabled"
        :size="size"
        :noLabel="noLabel"
        :upwindConfig="[config, upwindConfig]"
      />

      <!-- append slot -->
      <slot
        name="append"
        v-bind="{
          meta,
          styles: styles.input,
          appendIcon,
          appendAvatar,
          appendText,
          size,
        }"
      >
        <upw-icon
          v-if="appendIcon"
          :class="styles.input.icon"
          :icon="appendIcon"
        />

        <upw-icon
          v-if="appendAvatar"
          class="avatar"
          :class="styles.input.avatar"
          :icon="appendAvatar"
        />

        <span class="appendText" :class="styles.input.append" v-if="appendText">
          {{ appendText }}
        </span>
      </slot>
    </div>

    <!-- feedback -->
    <slot
      name="feedback"
      v-bind="{
        meta,
        noFeedback,
        errors,
        description,
        styles: styles.input,
      }"
    >
      <div
        class="feedback"
        :class="styles.inputFeedback.root"
        v-if="!noFeedback"
      >
        <upw-icon :class="styles.inputFeedback.icon" :icon="feedbackIcon" />
        <span>{{ errors || description }}</span>
      </div>
    </slot>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwLabel from "../label/Label.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import { isNil, isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "./types";

export default defineComponent({
  name: "UpwInput",
  components: {
    UpwIcon,
    UpwLabel,
  },
  props: {
    id: { type: String },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    requiredText: { type: String, default: "Required" },
    optionalText: { type: String, default: "" },
    // ---
    appendAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendText: { type: String },
    // ---
    prependAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependText: { type: String },
    // ---
    feedbackIcon: {
      type: [Object, String] as PropType<IconProps["icon"]>,
      default: "information-circle",
    },
    // ---
    size: { type: String as PropType<InputProps["size"]>, default: "md" },
    layout: {
      type: String as PropType<InputProps["layout"]>,
      default: "stacked",
    },
    variant: {
      type: String as PropType<InputProps["variant"]>,
      default: "outlined",
    },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    dirty: { type: Boolean },
    // ---
    noLabel: { type: Boolean },
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean, default: true },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: Object },
  },
  setup(props) {
    const meta = computed(() => ({
      layout: props.layout,
      variant: props.variant,
      size: props.size,
      // ---
      isInline: props.layout == "inline",
      // ---
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && props.dirty,
      isDirty: props.dirty,
      isRequired: props.required,
      isVisible: props.visible,
      isDisabled: props.disabled,
      hasFeedback:
        (isEmpty(props.errors) && !isNil(props.description)) ||
        !isEmpty(props.errors),
    }));

    const styles = useStyles(
      ["input", "inputFeedback"],
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
});
</script>
