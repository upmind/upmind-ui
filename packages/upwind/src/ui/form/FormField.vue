<template>
  <FormItem :formItemId="id">
    <!-- label -->
    <FormLabel :formItemId="id" :invalid="meta.isInvalid">
      {{ label }}
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
      <slot v-bind="{}"></slot>
    </FormControl>

    <!-- description -->
    <FormDescription
      v-if="description"
      :formDescriptionId="`form-item-description-${props.id}`"
    >
      {{ description }}
    </FormDescription>

    <!-- validation messages -->
    <FormMessage
      :formMessageId="`form-item-message-${props.id}`"
      :name="name"
      :errors="errors"
    />
  </FormItem>
  <pre>{{ props }}</pre>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";

// --- internal
import { useStyles } from "../../utils";
import config from "./form.config";

// -- components
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from ".";

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
console.log("FormField", styles);
// --- methods

// --- side effects

// --- lifecycle
</script>
