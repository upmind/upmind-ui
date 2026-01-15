<template>
  <UpmSessionLogout :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmSessionLogout } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Logout confirmation page - noindex
useHead({
  title: "Signed Out"
});

useSeoMeta({
  description: "You have been signed out successfully.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.SESSION_END
});
</script>
