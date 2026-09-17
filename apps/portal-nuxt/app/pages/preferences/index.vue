<template>
  <PortalPageHost
    :page-keys="pageKeys"
    :route-context="routeContext"
    aside-label="Notification preferences"
  />
</template>

<script setup lang="ts">
// Legacy served its notification preferences to a signed-OUT reader too
// (`views/client/auth/preferences`), reached from a link that carries a token
// in place of a session. No token is no link, which is the same past-using
// position the verification screens fall back to — and the token itself rides
// the page's own context to the selectors, as every other route fact does.
import { computed } from "vue";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { PageKey } from "~/portal/types";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { AUTH_QUERY_KEY, PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out-page" });

const route = useRoute();

const token = computed<string | undefined>(() => {
  const value = route.query[AUTH_QUERY_KEY.TOKEN];
  if (typeof value !== "string" || value === "") return undefined;
  return value;
});

const routeContext = computed<DataRouteContext>(() => ({
  token: token.value
}));

const pageKeys = computed<readonly PageKey[]>(() => {
  if (token.value === undefined) {
    return [PAGE_KEY.AUTH_VERIFY_EXPIRED, PAGE_KEY.AUTH_PREFERENCES];
  }
  return [PAGE_KEY.AUTH_PREFERENCES];
});
</script>
