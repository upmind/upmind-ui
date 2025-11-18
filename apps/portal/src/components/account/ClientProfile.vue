<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />

    <!-- v-show="uischema.showFieldsOnCheckout" -->
    <!-- Additional Options -->

    <!-- <Form
      v-if="!fieldsMeta.isLoading"
      :additional-errors="fieldsErrors?.data"
      :model-value="fieldsModel"
      :schema="fieldsSchema"
      :uischema="fieldsUischema"
      @reject="fieldsClear"
      @resolve="fieldsUpdate"
      @update:modelValue="fieldsUpdate"
      no-actions
      autosave
    /> -->
    <!-- :touched="fieldsMeta.showErrors" -->
    <pre>{{ fieldsMeta }}</pre>
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  // useBasket,
  useProfileFields
  // useClientCustomFields
  // useDataLayer,
  // useBrand,
  // ROUTE,
  // useRoutingEngine
} from "@upmind-automation/headless";

// --- components
import { UpmSection } from "@upmind-automation/client-vue";
// import Section from "@upmind-automation/client-vue/  components/section/Section.vue";

import { Form } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  isReady,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useProfileFields();

await isReady();

console.log("fieldsMeta", fieldsModel.value);
</script>
