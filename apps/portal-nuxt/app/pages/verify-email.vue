<template>
  <PortalPageHost :page-keys="pageKeys" aside-label="Email verification" />
</template>

<script setup lang="ts">
// The email-verification link's own two outcomes. A mock has no request to
// wait on, so the progress bar arrives full rather than animating a wait that
// is not happening — the same honesty the rest of this layer keeps.
import { computed } from "vue";
import type { PageKey } from "~/portal/types";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { AUTH_QUERY_KEY, AUTH_QUERY_VALUE, PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const route = useRoute();

const pageKeys = computed<readonly PageKey[]>(() => {
  const token = route.query[AUTH_QUERY_KEY.TOKEN];
  if (token === AUTH_QUERY_VALUE.EXPIRED) {
    return [PAGE_KEY.AUTH_VERIFY_EMAIL_EXPIRED, PAGE_KEY.AUTH_VERIFY_EMAIL];
  }
  return [PAGE_KEY.AUTH_VERIFY_EMAIL];
});
</script>
