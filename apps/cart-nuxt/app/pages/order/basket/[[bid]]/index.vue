<template>
  <Transitions>
    <UpmBasket
      :storefront-route="storefrontRoute"
      :basket-route="{ name: ROUTE.BASKET }"
      :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
      v-slot="{ template }"
    >
      <component :is="basketTemplate(template)" />
    </UpmBasket>
  </Transitions>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmBasket } from "@upmind-automation/basket";
import { useStorefrontRoute } from "../../../../composables/useStorefrontRoute";
import { ROUTE } from "../../../../funnels/types";
import Transitions from "../../../../shell/components/transition/Transition.vue";
import { basketTemplate } from "../../../../shell/modules/basket/shell";

const { t } = useI18n();

// SEO: Shopping cart page - noindex
useHead({
  title: t("seo.page_basket_title")
});

useSeoMeta({
  description: t("seo.page_basket_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET,
  actionEmptyBasket: true
});
const { storefrontRoute } = useStorefrontRoute();
</script>
