<template>
  <Section
    v-if="!fieldsMeta.isLoading"
    id="basket-fields"
    :label="t('text.additional_details')"
    icon="file-attachment-01"
    :class="basketCustomFieldsRootVariants()"
  >
    <Form
      :additional-errors="fieldsErrors?.data"
      :model-value="fieldsModel"
      :touched="route?.hash === '#basket-fields'"
      :schema="fieldsSchema"
      :uischema="fieldsUischema"
      @reject="fieldsClear"
      @resolve="fieldsUpdate"
      @update:modelValue="fieldsUpdate"
      no-actions
      autosave
    />
  </Section>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Form } from "@upmind-automation/foundation";
import { Section } from "@upmind-automation/foundation";
import { useBasketFields } from "@upmind-automation/headless";
import { basketCustomFieldsRootVariants } from "../basket.variants";

// --- types

// -----------------------------------------------------------------------------

const { t } = useI18n();
const route = useRoute();

const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useBasketFields();
</script>
