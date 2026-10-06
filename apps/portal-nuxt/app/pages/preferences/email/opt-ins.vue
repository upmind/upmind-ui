<template>
  <PortalPageHost
    :page-keys="pageKeys"
    :route-context="routeContext"
    aside-label="Email preferences"
  />
</template>

<script setup lang="ts">
// Legacy's `views/client/auth/emailOptIns`: the topics ONE address receives,
// reached signed out from a link naming both the address and its token. Both
// are route state, so they ride the page's own context to the selectors; a
// link missing either names nothing to manage, and falls back to the same
// past-using position the verification screens use.
import { computed } from "vue";
import type { PageKey } from "~/portal/types";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { routeQueryContext } from "~/portal/mock/injection";
import { PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const route = useRoute();

// The ONE threading every page shares (`mock/injection.ts`) — this page used
// to hand-roll a third copy of it naming `token` and `email` itself. It still
// declares the context it carries, so the pair is readable on the page as
// well as on the host.
const routeContext = computed(() => routeQueryContext(route.query));

const pageKeys = computed<readonly PageKey[]>(() => {
  const { token, email } = routeContext.value;
  const isAddressed = token !== undefined && email !== undefined;
  if (!isAddressed) {
    return [PAGE_KEY.AUTH_VERIFY_EXPIRED, PAGE_KEY.AUTH_EMAIL_OPT_INS];
  }
  return [PAGE_KEY.AUTH_EMAIL_OPT_INS];
});
</script>
