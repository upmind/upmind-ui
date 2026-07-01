<template>
  <UpmSessionLogout :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmSessionLogout } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
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
const { storefrontRoute } = useStorefrontRoute();
</script>
