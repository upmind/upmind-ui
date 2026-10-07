<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_CREDIT_NOTE_PRINT]"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>

<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockDetail } from "~/portal/mock/detail";
import { PAGE_KEY } from "~/portal/types";

// The print view of the SAME document (plan R11); the page's own Print
// control hands it to the browser, never a load-time dialog.
const { heading, routeContext } = useMockDetail(
  data => data.creditNotes,
  creditNote => `Credit note ${creditNote.number}`,
  "Credit note"
);
</script>
