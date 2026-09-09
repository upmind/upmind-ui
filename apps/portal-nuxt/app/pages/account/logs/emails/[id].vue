<script setup lang="ts">
import { computed } from "vue";
import type { DataRouteContext } from "~/portal/mock/injection";
import PortalPageHost from "~/portal/content/PortalPageHost.vue";
import { PAGE_KEY } from "~/portal/types";

// The email itself is client-vue's to fetch; the route only carries the id.
const route = useRoute();
const routeContext = computed<DataRouteContext>(() => ({
  entityId: String(route.params.id)
}));
</script>

<template>
  <PortalPageHost
    :page-keys="[PAGE_KEY.ACCOUNT_LOG_EMAIL_DETAIL]"
    heading="Email"
    :route-context="routeContext"
    aside-label="Account summary"
  />
</template>
