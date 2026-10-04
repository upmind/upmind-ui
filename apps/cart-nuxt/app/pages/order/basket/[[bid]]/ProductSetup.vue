<template>
  <UpmTransition>
    <UpmProductSetup
      :basket-route="{ name: ROUTE.BASKET }"
      v-slot="{ template }"
    >
      <component :is="PRODUCT_SETUP_TEMPLATES[template]" />
    </UpmProductSetup>
  </UpmTransition>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmProductSetup } from "@upmind-automation/basket";
import {
  PRODUCT_SETUP_TEMPLATES,
  UpmTransition
} from "@upmind-automation/client-vue";
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
