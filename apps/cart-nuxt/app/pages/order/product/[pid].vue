<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
    @product-details="handleProductDetails"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmProductConfigure, useBrand } from "@upmind-automation/client-vue";
import type { ProductDetails } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();
const { name: brandName, currency } = useBrand();

// Handle productDetails emitted from UpmProductConfigure
function handleProductDetails(details: ProductDetails) {
  const title = details.title || t("seo.page_product_title");
  const description = details.description || t("seo.page_product_description");
  const siteName = brandName.value || "Upmind Cart";

  // SEO meta tags
  useHead({ title });

  useSeoMeta({
    description,
    ogTitle: `${title} | ${siteName}`,
    ogDescription: description,
    ogImage: details.imgUrl,
    twitterTitle: `${title} | ${siteName}`,
    twitterDescription: description,
    twitterImage: details.imgUrl
  });

  // Schema.org: Product with rich data
  useSchemaOrg([
    defineProduct({
      name: title,
      description,
      image: details.imgUrl,
      brand: {
        "@type": "Brand",
        name: details.brand || siteName
      },
      category: details.category,
      offers: details.displayPrice
        ? {
            "@type": "Offer",
            price: details.displayPrice.price.currentAmount,
            priceCurrency: currency.value?.code || "USD",
            availability: "https://schema.org/InStock"
          }
        : undefined
    })
  ]);
}

definePageMeta({
  name: ROUTE.PRODUCT_CONFIGURE
});
const { storefrontRoute } = useStorefrontRoute();
</script>
