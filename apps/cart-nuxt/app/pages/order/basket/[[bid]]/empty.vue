<template>
  <UpmEmpty :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useStorefrontRoute } from "../../../../composables/useStorefrontRoute";
import { ROUTE } from "../../../../funnels/types";
import UpmEmpty from "../../../../shell/modules/system/Empty.vue";

const { t } = useI18n();

// SEO: Empty basket page - noindex
useHead({
  title: t("seo.page_basket_empty_title")
});

useSeoMeta({
  description: t("seo.page_basket_empty_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_EMPTY
});
const { storefrontRoute } = useStorefrontRoute();
</script>
