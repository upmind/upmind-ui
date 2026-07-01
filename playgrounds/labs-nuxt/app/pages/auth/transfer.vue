<template>
  <div>
    <h1>Session Transfer</h1>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { ROUTE } from "~/funnels/types";
const { t } = useI18n();

// SEO: Session transfer page - noindex (internal process)
useHead({
  title: t("seo.page_session_transfer_title")
});

useSeoMeta({
  description: t("seo.page_session_transfer_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.SESSION_TRANSFER
});
</script>
