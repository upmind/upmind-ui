<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockDetail } from "~/portal/mock/detail";
import { PAGE_KEY } from "~/portal/types";

const { heading, routeContext } = useMockDetail(
  data => data.childAccounts,
  child => child.name,
  "Child account"
);
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.ACCOUNT_CHILD_ACCOUNT_DETAIL]"
    :heading="heading"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>
