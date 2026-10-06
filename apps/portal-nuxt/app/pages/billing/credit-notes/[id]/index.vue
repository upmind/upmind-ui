<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_CREDIT_NOTE_DETAIL]"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>

<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockDetail } from "~/portal/mock/detail";
import { PAGE_KEY } from "~/portal/types";

const { heading, routeContext } = useMockDetail(
  data => data.creditNotes,
  creditNote => `Credit note ${creditNote.number}`,
  "Credit note"
);
</script>
