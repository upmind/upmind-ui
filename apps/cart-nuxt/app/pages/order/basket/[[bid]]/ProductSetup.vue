<template>
  <UpmProductSetup :basket-route="{ name: ROUTE.BASKET }" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmProductSetup } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

useHead({
  title: t("seo.page_basket_products_setup_title")
});

useSeoMeta({
  description: t("seo.page_basket_products_setup_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_PRODUCTS_SETUP
});
</script>
