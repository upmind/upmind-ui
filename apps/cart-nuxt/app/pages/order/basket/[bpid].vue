<template>
  <UpmBasketProductEdit
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
    @seo="handleSeo"
  />
</template>

<script lang="ts" setup>
import { UpmBasketProductEdit, useBrand } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { name: brandName } = useBrand();

// Handle SEO data emitted from UpmBasketProductEdit
function handleSeo(seo: {
  title?: string;
  description?: string;
  image?: string;
}) {
  const title = seo.title || t("seo.page_basket_edit_title");
  const description = seo.description || t("seo.page_basket_edit_description");
  const siteName = brandName.value || "Upmind Cart";

  useHead({ title });

  useSeoMeta({
    description,
    robots: "noindex, nofollow",
    ogTitle: `${title} | ${siteName}`,
    ogDescription: description
  });
}

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_EDIT
});
</script>
