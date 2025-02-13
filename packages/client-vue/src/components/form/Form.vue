<template>
  <Form v-bind="forwarded" :i18n="i18n">
    <template #footer="formFooterProps">
      <slot name="footer" v-bind="formFooterProps"></slot>
    </template>
    <template #actions="formActionsProps">
      <slot name="actions" v-bind="formActionsProps"></slot>
    </template>
  </Form>
</template>

<script lang="ts" setup>
// --- external

// --- components
import { Form, useForwardPropsEmits } from "@upmind-automation/upmind-ui";

// --- local
import { useFormI18n } from ".";

// --- utils

// --- types
import type {
  FormProps,
  FormFooterProps,
  FormActionsProps,
} from "@upmind-automation/upmind-ui";
// ----------------------------------------------

const props = defineProps<FormProps>();

const emits = defineEmits<{
  reject: [];
  resolve: [Object];
  "update:modelValue": [Object];
  "update:uischema": [Object];
  valid: [boolean];
  click: [{ model: object; meta: object }];
  action: [{ name: string; model: object; meta: object }];
}>();

const slots = defineSlots<{
  footer(props: FormFooterProps): void;
  actions(props: FormActionsProps): void;
}>();

const forwarded = useForwardPropsEmits(props, emits);

const i18n = useFormI18n();
// --- state

// --- computed
</script>
