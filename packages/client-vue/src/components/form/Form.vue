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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useForwardPropsEmits } from "radix-vue";
// --- components
import { Form } from "@upmind-automation/upmind-ui";

// --- local

// --- utils
import { isFunction } from "lodash-es";

// --- types
import type {
  FormProps,
  FormFooterProps,
  FormActionsProps,
} from "@upmind-automation/upmind-ui";
import type { JsonFormsI18nState } from "@jsonforms/core";
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

// --- state

// --- computed

// --- i18n
const { t, tm, locale } = useI18n();

const i18n = computed<JsonFormsI18nState>((): JsonFormsI18nState => {
  // Create a translator using vue-i18n's t function and the current locale

  const createTranslator =
    (_locale: string) => (key: string, defaultMessage: string, data: any) => {
      const value = isFunction(t) ? t(key, data) : null;
      debugger;
      return !value || value == key ? defaultMessage : value;
    };

  const safeLocale: string = locale.value;
  return {
    locale: safeLocale,
    translate: createTranslator(safeLocale),
  } as JsonFormsI18nState;
});
</script>
