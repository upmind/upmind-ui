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
              <slot v-if="props.icon" name="icon">
                <Icon :icon="props.icon" size="nano" />
              </slot>

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
                :open="tooltipOpen"
                side="right"
                class="control-radius max-w-72 text-center text-xs"
              >
                <Icon
                  @click="toggleTooltip()"
                  @mouseenter="toggleTooltip(true)"
                  @mouseleave="toggleTooltip(false)"
                  icon="info-circle"
                  size="nano"
                  class="text-muted hover:text-control-selected cursor-help transition-all duration-200"
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
// --- internal
import { Icon } from "../icon";
import { Tooltip } from "../tooltip";
import config from "./form.config";
import {
  FormItem,
  FormLabel,
  FormRequiredIndicator,
  FormNotRequiredIndicator,
  FormControl,
  FormDescription,
  FormMessage
} from ".";
import { cn, useStyles } from "../../utils";

// -- components
// --- utils
import { isEmpty, isNil, some, kebabCase } from "lodash-es";
// --- types
import type { FormControlProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<FormControlProps>(), {
  icon: "",
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
const tooltipOpen = ref(false);
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
);
// --- methods
function toggleTooltip(force?: boolean) {
  tooltipOpen.value = force ?? !tooltipOpen.value;
}
// --- side effects
// --- lifecycle
</script>
