<script setup lang="ts">
// The address the login screen carried across in its own link, handed to the
// page host as this route's context so the recovery form opens on it
// (`selectors.ts` `recoverFormModel`) — the same seam the catch-all uses for
// its own route facts.
import { computed } from "vue";
import type { DataRouteContext } from "~/portal/mock/injection";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { AUTH_QUERY_KEY, PAGE_KEY } from "~/portal/types";

definePageMeta({ layout: "logged-out" });

const route = useRoute();

const routeContext = computed<DataRouteContext>(() => {
  const username = route.query[AUTH_QUERY_KEY.USERNAME];
  if (typeof username !== "string") return {};
  return { username };
});
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.AUTH_FORGOTTEN_PASSWORD]"
    :route-context="routeContext"
    aside-label="Forgotten password"
  />
</template>
