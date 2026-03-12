<template>
  <Form
    :key="locale"
    v-bind="forwarded"
    :i18n="i18n"
    :ajv="ajv"
    :additional-renderers="formRenderers"
    :optional-text="t('text.optional')"
    data-testid="form"
  >
    <template #additional="{ meta }">
      <slot name="additional" v-bind="{ meta }"></slot>
    </template>
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
import { useValidation } from "@upmind-automation/headless";

// --- components
import { Form, useForwardPropsEmits } from "@upmind-automation/upmind-ui";
import { formRenderers } from "./renderers";

// --- local
import { useFormI18n } from ".";

// --- utils

// --- types
import type {
  FormProps,
  FormAdditionalProps,
  FormFooterProps,
  FormActionsProps
} from "@upmind-automation/upmind-ui";
import { useI18n } from "vue-i18n";
// -----------------------------------------------------------------------------
const props = defineProps<Omit<FormProps, "ajv">>();

const { t, locale } = useI18n();
// B: Always ensure we use our internal ajv instance
const { ajv } = useValidation();

const emits = defineEmits<{
  reject: [];
  resolve: [Record<string, any>];
  "update:modelValue": [any];
  "update:uischema": [any];
  valid: [boolean];
  click: [{ model: Record<string, any>; meta: Record<string, any> }];
  action: [
    { name: string; model: Record<string, any>; meta: Record<string, any> }
  ];
}>();

const slots = defineSlots<{
  additional: FormAdditionalProps;
  footer: FormFooterProps;
  actions: FormActionsProps;
}>();

const forwarded = useForwardPropsEmits(props, emits);

const i18n = useFormI18n();
// --- state

// --- computed
</script>
