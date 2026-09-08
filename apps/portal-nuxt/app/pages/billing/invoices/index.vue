<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { PAGE_KEY } from "~/portal/types";
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.BILLING_INVOICES]"
    aside-label="Account summary"
  />
</template>
