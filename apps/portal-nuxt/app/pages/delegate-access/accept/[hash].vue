<script setup lang="ts">
// The delegate invitation link's own landing (legacy `acceptInviteModal`).
// The HASH is a path segment, so it reaches the selectors as the route's
// token — the same member every other link-borne screen reads.
import { computed } from "vue";
import type { DataRouteContext } from "~/portal/mock/injection";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { PAGE_KEY } from "~/portal/types";

const route = useRoute();

const routeContext = computed<DataRouteContext>(() => {
  const hash = route.params["hash"];
  if (typeof hash !== "string") return {};
  return { token: hash };
});
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.DELEGATE_ACCESS_ACCEPT]"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>
