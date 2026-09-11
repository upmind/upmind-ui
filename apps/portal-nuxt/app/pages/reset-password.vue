<script setup lang="ts">
// A reset link that is past using says so rather than offering a form that
// cannot be submitted — legacy's own `hash.isExpiredOrInvalid` arm, as a
// position of its own.
import { computed } from "vue";
import type { PageKey } from "~/portal/types";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { AUTH_QUERY_KEY, AUTH_QUERY_VALUE, PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const route = useRoute();

const pageKeys = computed<readonly PageKey[]>(() => {
  const token = route.query[AUTH_QUERY_KEY.TOKEN];
  if (token === AUTH_QUERY_VALUE.EXPIRED) {
    return [PAGE_KEY.AUTH_VERIFY_EXPIRED];
  }
  return [PAGE_KEY.AUTH_RESET_PASSWORD];
});
</script>

<template>
  <PortalPageHost :page-keys="pageKeys" aside-label="Reset password" />
</template>
