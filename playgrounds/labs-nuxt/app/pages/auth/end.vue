<template>
  <UpmSessionLogout :storefront-route="{ to: { name: ROUTE.HOME } }" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmSessionLogout } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Logout page - noindex
useHead({
  title: t("seo.page_logout_title")
});

useSeoMeta({
  description: t("seo.page_logout_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.SESSION_END
});
</script>
