<template>
  <FormItem
    :formItemId="id"
    v-if="meta.isVisible"
    :class="cn('flex flex-wrap', props.class)"
    :data-visible="meta.isVisible"
    v-bind="
      useTestAttrs({
        key: 'form-item',
        value: [kebabCase(props.name), props.id]
      })
    "
  >
    <slot name="field">
      <!-- label -->
      <div class="flex w-full flex-col gap-1">
        <FormLabel v-if="meta.hasLabel" :formItemId="id">
          <slot name="label" :label="label">
            <span class="inline-flex w-full items-center gap-x-2">
              <slot v-if="props.icon" name="icon">
                <Icon :icon="props.icon" size="xs" />
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
                :open="tooltipOpen"
                side="right"
                class="max-w-72 text-center text-xs"
              >
                <Icon
                  @click="toggleTooltip()"
                  @mouseenter="toggleTooltip(true)"
                  @mouseleave="toggleTooltip(false)"
                  icon="info-circle"
                  size="xs"
                  class="text-muted hover:text-body cursor-help transition-all duration-200"
                />
                <template #content>{{ tooltip }}</template>
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
          :formMessageId="`form-item-message-${props.id}`"
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
            v-bind="
              useTestAttrs({
                key: 'form-item-message',
                value: [kebabCase(props.name), props.id]
              })
            "
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
import { ref, computed, useSlots } from "vue";
import { Tooltip, cn, useTestAttrs } from "@upmind/ui";
import { Icon } from "../../icon";
import FormControl from "./FormControl.vue";
import FormDescription from "./FormDescription.vue";
import FormItem from "./FormItem.vue";
import FormLabel from "./FormLabel.vue";
import FormMessage from "./FormMessage.vue";
import FormNotRequiredIndicator from "./FormNotRequiredIndicator.vue";
import FormRequiredIndicator from "./FormRequiredIndicator.vue";
import { isEmpty, isNil, some, kebabCase } from "lodash-es";
import type { FormControlProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<FormControlProps>(), {
  icon: "",
  label: "",
  text: "",
  tags: () => [],
  errors: () => [],
  autoFocus: false,
  required: false,
  disabled: false,
  visible: true,
  dirty: false,
  touched: false
});

const slots = useSlots();
// --- state
const tooltipOpen = ref(false);
// --- computed
const meta = computed(() => ({
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
}));
// --- methods
function toggleTooltip(force?: boolean) {
  tooltipOpen.value = force ?? !tooltipOpen.value;
}
</script>
