<template>
  <UpmOrder
    :storefront-route="storefrontRoute"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmOrder } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Order confirmation page - noindex
useHead({
  title: t("seo.page_order_title")
});

useSeoMeta({
  description: t("seo.page_order_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.ORDER
});
const { storefrontRoute } = useStorefrontRoute();
</script>
