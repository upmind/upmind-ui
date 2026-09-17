<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_INVOICE_PRINT]"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>

<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockDetail } from "~/portal/mock/detail";
import { PAGE_KEY } from "~/portal/types";

// The print view of the SAME document (plan R11) — a download opens this
// rather than a PDF the mock has no way to make. Nothing prints itself: the
// page's own Print control hands it to the browser.
const { heading, routeContext } = useMockDetail(
  data => data.invoices,
  invoice => `Invoice ${invoice.number}`,
  "Invoice"
);
</script>
