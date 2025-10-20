<template>
  <FormItem
    :formItemId="id"
    v-if="meta.isVisible"
    :class="cn('flex flex-wrap', props.class)"
    :data-visible="meta.isVisible"
    :data-testid="`form-item-${kebabCase(props.name || props.label)}`"
  >
    <slot name="field">
      <!-- label -->
      <div class="flex w-full flex-col gap-1">
        <FormLabel v-if="meta.hasLabel" :formItemId="id">
          <slot name="label" :label="label">
            <span class="inline-flex w-full items-center gap-x-2">
              <slot name="icon" />

              <span
                >{{ label }}
                <FormRequiredIndicator
                  v-if="meta.isRequired"
                  :formItemId="id"
                  :text="props.requiredText"
              /></span>

              <Tooltip
                v-if="tooltip"
                :label="tooltip"
                side="right"
                color="info"
                class="control-radius max-w-72 text-center text-xs"
              >
                <Icon
                  icon="info-circle"
                  size="nano"
                  class="text-muted hover:text-control-selected transition-all duration-200"
                />
              </Tooltip>

              <FormNotRequiredIndicator
                v-if="!meta.isRequired"
                :formItemId="id"
                class="ml-auto"
                :text="props.optionalText"
              />
            </span>
          </slot>
        </FormLabel>

        <!-- input -->
        <FormControl
          :key="props.id"
          :invalid="meta.isInvalid"
          :disabled="props.disabled"
          :required="props.required"
          :formItemId="props.id"
          :auto-focus="props.autoFocus"
          :formDescriptionId="`form-item-description-${props.id}`"
          :formMessageId="`form-item-message-${props.id.replaceAll('#/properties/', '')}`"
        >
          <slot></slot>
        </FormControl>

        <!-- validation messages -->
        <slot name="messages">
          <FormMessage
            v-if="meta.isInvalid && !props.noErrors"
            :formMessageId="`form-item-message-${props.id}`"
            :name="name"
            :errors="errors"
            :data-testid="`form-item-message-${props.name.replaceAll('.', '-')}`"
          />
        </slot>

        <!-- description -->
        <FormDescription
          v-if="meta.hasDescription"
          :formDescriptionId="`form-item-description-${props.id}`"
        >
          {{ description }}
        </FormDescription>
      </div>
    </slot>
  </FormItem>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, useSlots } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./form.config";

// -- components
import {
  FormItem,
  FormLabel,
  FormRequiredIndicator,
  FormNotRequiredIndicator,
  FormControl,
  FormDescription,
  FormMessage
} from ".";
import { Tooltip } from "../tooltip";
import { Icon } from "../icon";

// --- utils
import { isEmpty, isNil, some, kebabCase } from "lodash-es";

// --- types
import type { FormControlProps } from "./types";
import type { ComputedRef } from "vue";

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
  touched: false,
  // ---
  uiConfig: () => ({
    form: {
      root: [],
      loading: [],
      content: [],
      actions: []
    }
  })
});

const slots = useSlots();

// --- state
const target = ref();

// --- computed
const meta = computed(
  (): {
    isInvalid: boolean;
    isValid: boolean;
    isDirty: boolean;
    isTouched: boolean;
    isRequired: boolean;
    isVisible: boolean | null;
    isDisabled: boolean;
    hasDescription: boolean;
    hasLabel: boolean;
    hasFeedback: boolean;
    shouldFocus: boolean;
  } => ({
    // size: props.size,
    // layout: props.layout,
    // variant: props.variant,
    // ---
    // isInline: props.layout == "inline",
    // isPersisted: props.persistFeedback || !isEmpty(props.errors),
    // ---
    isInvalid: !isEmpty(props.errors) && props.touched,
    isValid: isEmpty(props.errors),
    isDirty: props.dirty,
    isTouched: props.touched,
    isRequired: props.required,
    isVisible: isNil(props.visible) || props.visible,
    isDisabled: props.disabled,
    hasDescription: !isEmpty(props.description),
    hasLabel: (!isEmpty(props.label) || some(slots, "label")) && !props.noLabel,
    hasFeedback:
      (isEmpty(props.errors) && !isEmpty(props.description)) ||
      !isEmpty(props.errors),
    shouldFocus: !!props.autoFocus
  })
);

const styles = useStyles(
  ["input", "input.feedback", "input.description"],
  meta,
  config,
  target,
  props.uiConfig ?? {}
) as ComputedRef<{
  input: {
    feedback: string;
    description: string;
  };
}>;

// --- methods

// --- side effects

// --- lifecycle
</script>
