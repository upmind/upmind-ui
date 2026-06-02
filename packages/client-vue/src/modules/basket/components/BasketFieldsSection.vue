<template>
  <Section
    v-if="!fieldsMeta.isLoading"
    id="basket-fields"
    :label="t('text.additional_details')"
    icon="file-attachment-01"
    :class="styles.basket.customFields.root"
    :ui-config="{
      section: {
        root: styles.basket.items.root,
        content: styles.basket.items.content
      } as any
    }"
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
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

// --- internal
import { useBasketFields } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../basket.config";

// --- components
import Form from "../../../components/form/Form.vue";
import Section from "../../../components/section/Section.vue";

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

const layout = computed(() => {
  return route?.meta?.template;
});

const styles = useStyles(
  ["basket.expand", "basket.items", "basket.customFields", "basket.aside"],
  { variant: layout.value },
  config
);
</script>
