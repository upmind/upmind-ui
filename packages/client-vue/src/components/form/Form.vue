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
import { useForwardPropsEmits } from "radix-vue";

// --- components
import { Form } from "@upmind-automation/upmind-ui";

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
  click: [{ model: Object; meta: Object }];
  action: [{ name: string; model: Object; meta: Object }];
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
