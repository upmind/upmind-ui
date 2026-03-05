<template>
  <UpmSessionLogout :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { UpmSessionLogout } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types"
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { useI18n } from "vue-i18n";

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
