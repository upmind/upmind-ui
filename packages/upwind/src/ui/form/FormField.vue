<template>
  <FormItem
    :formItemId="id"
    v-show="meta.isVisible"
    v-auto-animate
    :class="cn('flex flex-wrap', props.class)"
  >
    <slot name="field">
      <!-- label -->
      <div
        class="flex w-full flex-row flex-nowrap items-center justify-between"
        v-if="meta.hasLabel"
      >
        <FormLabel :formItemId="id" :invalid="meta.isInvalid">
          <slot name="label" :label="label">
            <span class="inline-flex items-center gap-x-1">
              <span>{{ label }}</span>

              <FormRequiredIndicator v-if="meta.isRequired" :formItemId="id" />

              <Tooltip
                v-if="tooltip"
                :label="tooltip"
                side="right"
                color="primary"
              >
                <Icon
                  icon="information-circle-alt"
                  size="2xs"
                  class="opacity-50 transition-all duration-300 hover:opacity-100"
                />
              </Tooltip>
            </span>
          </slot>
        </FormLabel>
      </div>

      <!-- text -->

      <!-- tags -->

      <!-- input -->
      <FormControl
        :invalid="meta.isInvalid"
        :disabled="props.disabled"
        :required="props.required"
        :formItemId="props.id"
        :formDescriptionId="`form-item-description-${props.id}`"
        :formMessageId="`form-item-message-${props.id}`"
        v-intersection-observer="[maybeFocus, { threshold: 0.25 }]"
      >
        <slot></slot>
      </FormControl>

      <!-- validation messages -->
      <FormMessage
        v-if="meta.isInvalid"
        :formMessageId="`form-item-message-${props.id}`"
        :name="name"
        :errors="errors"
      />

      <!-- description -->
      <FormDescription
        v-if="meta.hasDescription"
        :formDescriptionId="`form-item-description-${props.id}`"
      >
        {{ description }}
      </FormDescription>
    </slot>
  </FormItem>

  <!-- debug -->
  <!-- <pre>{{ props }}</pre> -->
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, useSlots } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { vIntersectionObserver } from "@vueuse/components";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./form.config";

// -- components
import {
  FormItem,
  FormLabel,
  FormRequiredIndicator,
  FormControl,
  FormDescription,
  FormMessage,
} from ".";
import { Tooltip } from "../tooltip";
import { Icon } from "../icon";

// --- utils
import { isEmpty, isNil, some } from "lodash-es";

// --- types
import type { FormControlProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<FormControlProps>(), {
  label: "",
  text: "",
  tags: () => [],
  errors: () => [],
  // size: "md",
  autoFocus: false,
  // ---

  required: false,
  disabled: false,
  visible: true,
  dirty: false,
  // ---
  upwindConfig: () => ({
    form: {
      root: [],
      loading: [],
      content: [],
      actions: [],
    },
  }),
});

const slots = useSlots();

// --- state
const target = ref();

// --- computed
const meta = computed(() => ({
  // size: props.size,
  // layout: props.layout,
  // variant: props.variant,
  // ---
  // isInline: props.layout == "inline",
  // isPersisted: props.persistFeedback || !isEmpty(props.errors),
  // ---
  isInvalid: !isEmpty(props.errors),
  isValid: isEmpty(props.errors) && props.dirty,
  isDirty: props.dirty,
  isRequired: props.required,
  isVisible: isNil(props.visible) || props.visible,
  isDisabled: props.disabled,
  hasDescription: !isEmpty(props.description),
  hasLabel: (!isEmpty(props.label) || some(slots, "label")) && !props.noLabel,
  hasFeedback:
    (isEmpty(props.errors) && !isEmpty(props.description)) ||
    !isEmpty(props.errors),
  shouldFocus: !!props.autoFocus,
}));

const variants = useStyles(
  ["input", "input.feedback"],
  meta,
  config,
  target,
  props.upwindConfig
);

// --- methods

function maybeFocus([section]) {
  if (meta.value.shouldFocus && section.isIntersecting) {
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

// --- side effects

// --- lifecycle
</script>
