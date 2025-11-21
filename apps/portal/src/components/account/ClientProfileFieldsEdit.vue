<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />

    <!-- v-show="uischema.showFieldsOnCheckout" -->
    <!-- Additional Options -->

    <Form
      v-if="!profileDetailsMeta.isLoading"
      :additional-errors="fieldsErrors?.data"
      :model-value="fieldsModel"
      :schema="fieldsSchema"
      :uischema="fieldsUischema"
      :touched="profileDetailsMeta.showErrors"
      @reject="fieldsClear"
      @resolve="fieldsUpdate"
      @update:modelValue="fieldsUpdate"
      no-actions
      autosave
    />
    <!--  -->
    <pre>{{ fieldsSchema }}</pre>
  </UpmSection>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
// import { useRouter } from "vue-router";

// --- internal
import { useProfileFieldsManager } from "@upmind-automation/headless";

// --- components
import { UpmSection } from "@upmind-automation/client-vue";
// import { Link } from "@upmind-automation/upmind-ui";
import { Form } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{ fields: string[] }>();

const { t } = useI18n();

const {
  errors: fieldsErrors,
  meta: profileDetailsMeta,
  // data: profileDetailsData,
  isReady,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
  // edit: doEdit
} = useProfileFieldsManager({
  filterFields: props.fields
});

// await isReady();
</script>
