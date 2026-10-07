<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.ACCOUNT_LOGS]"
    aside-label="Account summary"
  />
</template>

<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { PAGE_KEY } from "~/portal/types";
</script>
