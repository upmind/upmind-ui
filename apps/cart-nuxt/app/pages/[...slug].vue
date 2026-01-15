<!--
  Error/404 Page
  Catch-all route for handling 404 and other error states.
  Should not be indexed by search engines (best practice).
-->
<template>
  <UpmError :status="404" :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Exclude error pages from search engine indexing (best practice)
useHead({
  title: "Page Not Found"
});

useSeoMeta({
  description: "The page you're looking for could not be found.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.ERROR
});
</script>
