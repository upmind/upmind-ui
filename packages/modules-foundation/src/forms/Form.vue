<template>
  <Form
    :key="locale"
    v-bind="forwarded"
    :i18n="i18n"
    :ajv="ajv"
    :additional-renderers="renderers"
    :optional-text="t('text.optional')"
    :dataAttrs="assign({ 'data-test-key': 'form' }, props.dataAttrs)"
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
import {
  Form,
  provideFormEngineData,
  provideFormIcon,
  useForwardPropsEmits
} from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { useSystem, useValidation } from "@upmind-automation/headless";
import { Icon } from "../icon";
import { useFormRenderers } from "../renderers";
import { useFormI18n } from "./useFormI18n";
import { assign } from "lodash-es";
import type {
  FormProps,
  FormAdditionalProps,
  FormFooterProps,
  FormActionsProps
} from "@upmind/ui";
// -----------------------------------------------------------------------------
const props = defineProps<Omit<FormProps, "ajv">>();

const { t, locale } = useI18n();
// B: Always ensure we use our internal ajv instance
const { ajv } = useValidation();
const { countries, ensureCountries } = useSystem();

// The engine takes its glyph and its reference data from the host: it resolves
// neither an app icon name-map nor a BE country list itself.
provideFormIcon(Icon);
provideFormEngineData({ countries, ensureCountries });

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

const _slots = defineSlots<{
  additional: FormAdditionalProps;
  footer: FormFooterProps;
  actions: FormActionsProps;
}>();

const forwarded = useForwardPropsEmits(props, emits);

const i18n = useFormI18n();

const { renderers } = useFormRenderers();
</script>
