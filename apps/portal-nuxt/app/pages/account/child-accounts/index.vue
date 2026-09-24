<script setup lang="ts">
// Legacy served this page only to an account the relation actually applies to
// — a parent with children, or a child under one. Neither, and the menu entry
// is already absent, so a client who arrives by URL lands on their profile
// rather than on an empty page about somebody else's accounts.
//
// Not awaited, and `replace`, exactly as the support pillar's own guard is:
// awaiting it in `setup` suspends the page behind a navigation it is itself
// being replaced by.
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { useMockBrandGates } from "~/portal/mock/gates";
import { PAGE_KEY } from "~/portal/types";

const { hasChildAccounts, isChildAccount } = useMockBrandGates();

if (!hasChildAccounts.value && !isChildAccount.value) {
  navigateTo("/account/profile", { replace: true });
}
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.ACCOUNT_CHILD_ACCOUNTS]"
    aside-label="Account summary"
  />
</template>
