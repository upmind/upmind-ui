<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_CREDIT_STATEMENT_PRINT]"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>

<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockDetail } from "~/portal/mock/detail";
import { useMockWallet } from "~/portal/mock/facades";
import { PAGE_KEY } from "~/portal/types";

// A statement's "Download PDF" opens this (plan R11) — the same figures its
// row carried, on a bare page the browser can print. The periods are the
// facade's computed views, not seeded rows, so the heading reads off those.
const { heading, routeContext } = useMockDetail(
  data => useMockWallet(data).useContext().data.value.statements,
  statement => `Credit statement ${statement.fromDate} to ${statement.toDate}`,
  "Credit statement"
);
</script>
