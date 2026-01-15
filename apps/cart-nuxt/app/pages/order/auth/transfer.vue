<template>
  <div>
    <h1>Session Transfer</h1>
  </div>
</template>

<script lang="ts" setup>
import { ROUTE } from "~/funnels/types";

// SEO: Session transfer page - noindex (internal process)
useHead({
  title: "Transfering..."
});

useSeoMeta({
  description: "Transferring your session...",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.SESSION_TRANSFER
});
</script>
