<script setup lang="ts">
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockBrandGates } from "~/portal/mock/gates";
import { PAGE_KEY } from "~/portal/types";

// Legacy's support guard (plan R8): a brand with the support system disabled
// serves no ticket route — the same in-setup redirect the pillar landing
// pages use. NOT awaited: a top-level `await` makes the whole setup async,
// and an async page renders nothing until it resolves, its own title
// included.
const { isSupportDisabled, homePath } = useMockBrandGates();
if (isSupportDisabled.value) void navigateTo(homePath.value, { replace: true });
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.SUPPORT_TICKETS]"
    aside-label="Account summary"
  />
</template>
