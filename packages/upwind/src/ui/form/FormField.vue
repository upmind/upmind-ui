<template>
  <FormItem
    :formItemId="id"
    v-auto-animate
    :class="cn('flex flex-wrap', props.class)"
  >
    <slot name="field">
      <!-- label -->
      <FormLabel :formItemId="id" :invalid="meta.isInvalid">
        <slot name="label" :label="label">
          <span class="inline-flex items-center gap-x-1">
            <span>{{ label }}</span>
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

      <!-- text -->

      <!-- tags -->

      <!-- input -->
      <FormControl
        :invalid="meta.isInvalid"
        :formItemId="props.id"
        :formDescriptionId="`form-item-description-${props.id}`"
        :formMessageId="`form-item-message-${props.id}`"
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
import { ref, computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./form.config";

// -- components
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from ".";
import { Tooltip } from "../tooltip";
import { Icon } from "../icon";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { FormControlProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<FormControlProps>(), {
  label: "",
  text: "",
  tags: () => [],
  errors: () => [],
  size: "md",
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

// --- state
const target = ref();

// --- computed
const meta = computed(() => ({
  size: props.size,
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
  isVisible: props.visible,
  isDisabled: props.disabled,
  hasDescription: !isEmpty(props.description),
  hasFeedback:
    (isEmpty(props.errors) && !isEmpty(props.description)) ||
    !isEmpty(props.errors),
}));

const variants = useStyles(
  ["input", "input.feedback"],
  meta,
  config,
  target,
  props.upwindConfig
);

// --- methods

// --- side effects

// --- lifecycle
</script>
