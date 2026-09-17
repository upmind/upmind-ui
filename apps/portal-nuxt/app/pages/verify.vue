<template>
  <PortalPageHost :page-keys="pageKeys" aside-label="Account verification" />
</template>

<script setup lang="ts">
// Legacy's verification screen has three outcomes and no state of its own: the
// link still wants a password, the link is past using, or the account is
// already verified. Each is its own position, because they are different
// screens rather than one screen in three moods.
import { computed } from "vue";
import type { PageKey } from "~/portal/types";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { AUTH_QUERY_KEY, AUTH_QUERY_VALUE, PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out-page" });

const route = useRoute();

const pageKeys = computed<readonly PageKey[]>(() => {
  const { query } = route;
  if (query[AUTH_QUERY_KEY.TOKEN] === AUTH_QUERY_VALUE.EXPIRED) {
    return [PAGE_KEY.AUTH_VERIFY_EXPIRED, PAGE_KEY.AUTH_VERIFY];
  }
  if (query[AUTH_QUERY_KEY.NEEDS_PASSWORD] === AUTH_QUERY_VALUE.YES) {
    return [PAGE_KEY.AUTH_VERIFY_SET_PASSWORD, PAGE_KEY.AUTH_VERIFY];
  }
  return [PAGE_KEY.AUTH_VERIFY];
});
</script>
