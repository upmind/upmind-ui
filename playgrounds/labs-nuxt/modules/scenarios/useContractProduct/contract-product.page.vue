<template>
  <Page :data-attrs="{ 'data-test-key': 'contract-product-page' }">
    <PageHeader>
      <PageTitle>{{ t("labs.contract_product_title") }}</PageTitle>
      <PageDescription>
        {{ t("labs.contract_product_description") }}
      </PageDescription>
    </PageHeader>

    <PageBody class="gap-10">
      <Alert
        variant="neutral"
        appearance="outline"
        :title="t('labs.contract_product_pending')"
        :description="t('labs.contract_product_pending_text')"
        :data-attrs="{ 'data-test-key': 'contract-product-pending' }"
      >
        <template #icon><Icon icon="box" /></template>
      </Alert>
    </PageBody>
  </Page>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useContractProduct/contract-product.page
 * @description STUB until CT-1 (FE-3029) + CT-2 (FE-3206). It boots NO
 * composable and holds no product data: there is no contracts module to read
 * from, and mock rows would be a shape the real one has to contradict.
 *
 * What is real here is the ROUTE — the funnel gates a session on it and reads
 * `?init=upgrade` there, so the deep link is driveable before the data is.
 */

import {
  Alert,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageTitle
} from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file.
definePageMeta({
  key: route => route.fullPath
});

const { t } = useI18n();
</script>
