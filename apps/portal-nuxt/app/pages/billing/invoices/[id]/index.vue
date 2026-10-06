<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_INVOICE_DETAIL]"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>

<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockDetail } from "~/portal/mock/detail";
import { PAGE_KEY } from "~/portal/types";

// The invoice's own NUMBER heads the page, as legacy's document did — the spec
// row below shows the same number, so an id here contradicted it.
const { heading, routeContext } = useMockDetail(
  data => data.invoices,
  invoice => `Invoice ${invoice.number}`,
  "Invoice"
);
</script>
