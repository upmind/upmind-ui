<!--
  Storefront Route
  This is a transitional route that will redirect accordingly via middleware.
  The actual destination is determined by the routing engine based on session state.
  Should not be indexed by search engines.
-->
<template>
  <div />
</template>

<script lang="ts" setup>
import { ROUTE } from "~/funnels/types";

// SEO: Exclude transitional redirect page from search engine indexing
useHead({
  title: "Redirecting..."
});

useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.STOREFRONT
});
</script>
