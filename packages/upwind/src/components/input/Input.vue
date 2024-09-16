<template>
  <div v-if="meta.isVisible" :class="styles.input.root">
    <!-- conditionally add our label for non inline inputs -->
    <upw-label
      v-if="!meta.isInline"
      :id="id"
      :text="label"
      :alt-text="text"
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
    >
      <template #default="slotProps">
        <slot name="label" v-bind="{ meta, ...slotProps }"></slot>
      </template>
    </upw-label>

    <!-- input wrapper -->
    <div :class="styles.input.wrapper">
      <!-- prepend slot-->

      <span :class="styles.input.prependWrapper">
        <slot
          name="prepend"
          v-bind="{
            meta,
            styles: styles.input,
            icon: prependIcon,
            avatar: prependAvatar,
            tetx: prependText,
            size,
          }"
        >
          <slot
            name="prepend.text"
            v-bind="{ meta, styles: styles.input, text: prependText }"
          >
            <span :class="styles.input.prepend" v-if="prependText">
              {{ prependText }}
            </span>
          </slot>

          <slot
            name="prepend.avatar"
            v-bind="{ meta, styles: styles.input, avatar: prependAvatar }"
          >
            <upw-icon
              v-if="prependAvatar"
              class="avatar"
              :class="styles.input.avatar"
              :icon="prependAvatar"
            />
          </slot>

          <slot
            name="prepend.icon"
            v-bind="{ meta, styles: styles.input, icon: prependIcon }"
          >
            <upw-icon
              v-if="prependIcon"
              :class="styles.input.icon"
              :icon="prependIcon"
            />
          </slot>
        </slot>
      </span>

      <span
        :class="styles.input.control"
        v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
      >
        <!-- main slot where actual input gets injected -->
        <slot v-bind="{ meta, styles: styles.input, size }"></slot>

        <!-- conditionally add our label for inline inputs -->
        <upw-label
          v-if="meta.isInline"
          :id="id"
          :text="label"
          :alt-text="text"
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
        >
          <template #default="slotProps">
            <slot name="label" v-bind="{ meta, ...slotProps }"></slot>
          </template>
        </upw-label>
      </span>

      <!-- append slot -->
      <span :class="styles.input.appendWrapper">
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
          <slot
            name="append.icon"
            v-bind="{ meta, styles: styles.input, icon: appendIcon }"
          >
            <upw-icon
              v-if="appendIcon"
              :class="styles.input.icon"
              :icon="appendIcon"
            />
          </slot>

          <slot
            name="append.avatar"
            v-bind="{ meta, styles: styles.input, avatar: appendAvatar }"
          >
            <upw-icon
              v-if="appendAvatar"
              class="avatar"
              :class="styles.input.avatar"
              :icon="appendAvatar"
            />
          </slot>

          <slot
            name="append.text"
            v-bind="{ meta, styles: styles.input, text: appendText }"
          >
            <span class="appendText" v-if="appendText">
              {{ appendText }}
            </span>
          </slot>
        </slot>
      </span>
    </div>

    <!-- feedback -->
    <div
      class="feedback"
      :class="styles.input.feedback.root"
      v-if="!noFeedback"
    >
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
        <upw-icon
          :class="styles.input.feedback.icon"
          :icon="feedbackIcon"
          v-if="meta.hasFeedback"
        />
        <span v-if="meta.hasFeedback">{{ safeErrors || description }}</span>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref, watch } from "vue";
import { vIntersectionObserver } from "@vueuse/components";

// --- components
import UpwIcon from "../../ui/icon/Icon.ce.vue";
import UpwLabel from "../label/Label.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useStyles } from "../../utils";
import { has, isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "./types";

export default defineComponent({
  name: "UpwInput",
  components: {
    UpwIcon,
    UpwLabel,
  },
  directives: { "intersection-observer": vIntersectionObserver },
  props: {
    id: { type: String },
    label: { type: String },
    text: { type: String },
    description: { type: String },
    errors: { type: [String, Array] },
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
    size: { type: String as PropType<InputProps["size"]> },
    layout: {
      type: String as PropType<InputProps["layout"]>,
      default: "stacked",
    },
    variant: {
      type: String as PropType<InputProps["variant"]>,
      default: "outline",
    },
    // ---
    autofocus: { type: Boolean },
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    dirty: { type: Boolean },
    // ---
    noLabel: { type: Boolean },
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: Object },
  },
  setup(props) {
    const target = ref();

    const meta = computed(() => ({
      layout: props.layout,
      variant: props.variant,
      size: props.size,
      // ---
      isInline: props.layout == "inline",
      isPersisted: props.persistFeedback || !isEmpty(props.errors),
      // ---
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && props.dirty,
      isDirty: props.dirty,
      isRequired: props.required,
      isVisible: props.visible,
      isDisabled: props.disabled,
      hasFeedback:
        (isEmpty(props.errors) && !isEmpty(props.description)) ||
        !isEmpty(props.errors),
    }));

    const styles = useStyles(
      ["input", "input.feedback"],
      meta,
      config,
      target,
      props.upwindConfig
    );

    function maybeFocus([section]) {
      if (props.autofocus && section.isIntersecting) {
        let el = section.target;
        if (
          !["input", "textarea", "select", "button"].includes(
            el.tagName.toLowerCase()
          )
        ) {
          el = el.querySelector("input");
        }
        if (el.getAttribute("tabindex")) {
          el.setAttribute("tabindex", -1);
        }
        el.focus();
      }
    }

    return {
      meta,
      config,
      styles,
      target,
      maybeFocus,
    };
  },
  computed: {
    safeErrors() {
      return Array.isArray(this.errors) ? this.errors.join() : this.errors;
    },
  },
});
</script>
