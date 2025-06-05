<template>
  <Form v-bind="forwarded" :i18n="i18n" :ajv="ajv">
    <template #footer="{ meta }">
      <slot name="footer" v-bind="{ meta }"></slot>
    </template>
    <template #actions="{ meta, doResolve, doReject }">
      <slot name="actions" v-bind="{ meta, doResolve, doReject }"></slot>
    </template>
  </Form>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { utils } from "@upmind-automation/headless";
const { useValidation } = utils;
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

const props = defineProps<Omit<FormProps, "ajv">>();

// B: Always ensure we use our internal ajv instance
const { ajv } = useValidation();

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
  footer: FormFooterProps;
  actions: FormActionsProps;
}>();

const forwarded = useForwardPropsEmits(props, emits);

const i18n = useFormI18n();
// --- state

// --- computed
</script>
