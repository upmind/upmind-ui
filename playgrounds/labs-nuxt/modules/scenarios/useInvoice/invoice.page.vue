<template>
  <div data-test-key="invoice-page">
    <Suspense>
      <OrderView />
      <template #fallback>
        <div class="flex justify-center p-8">
          <Spinner :label="t('text.loading')" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script lang="ts" setup>
/**
 * @module scenarios/useInvoice/invoice.page
 * @description The ONE order/invoice route — `/useInvoice/:oid`. It renders the
 * rich `OrderView` (a labs copy of `UpmOrder` with the pay CONTROLS removed): the
 * hero, the order status, the line items and summary, plus a Pay button. Paying
 * happens in the `?init=pay` pay modal (`overlay-payment`, `useOrder`), never on
 * this page. `OrderView` reads the `:oid` route param itself.
 */

import { Spinner } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import OrderView from "~/components/OrderView.vue";

// NO `name`, `path` or `nav` here: the registrar owns all three, off the
// declaration beside this file (and its declared `params: ["oid"]`).
definePageMeta({
  key: route => route.fullPath
});

const { t } = useI18n();
</script>
