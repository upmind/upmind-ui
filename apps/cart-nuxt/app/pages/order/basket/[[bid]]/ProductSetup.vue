<template>
  <Transitions>
    <UpmProductSetup
      :basket-route="{ name: ROUTE.BASKET }"
      v-slot="{ template }"
    >
      <component :is="PRODUCT_SETUP_TEMPLATES[template]" />
    </UpmProductSetup>
  </Transitions>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmProductSetup } from "@upmind-automation/basket";
import { ROUTE } from "../../../../funnels/types";
import Transitions from "../../../../shell/components/transition/Transition.vue";
import { PRODUCT_SETUP_TEMPLATES } from "../../../../shell/modules/product-setup/shell";

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
