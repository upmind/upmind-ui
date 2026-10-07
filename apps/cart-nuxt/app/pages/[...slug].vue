<template>
  <UpmError :status="404" :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStorefrontRoute } from "../composables/useStorefrontRoute";
import { ROUTE } from "../funnels/types";
import UpmError from "../shell/modules/system/Error.vue";

const { t } = useI18n();

// SEO: 404 Error page - noindex
useHead({
  title: t("seo.page_error_title")
});

useSeoMeta({
  description: t("seo.page_error_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.ERROR,
  allowOverlays: false
});
const { storefrontRoute } = useStorefrontRoute();
</script>
