<template>
  <Layout>
    <template #navigation>
      <Breadcrumb :items="items" />
    </template>

    <template #actions>
      <Share class="hidden md:flex" />
    </template>

    <ContentSection v-auto-animate class="flex flex-grow items-center">
      <form v-auto-animate @submit.prevent @reset.prevent>
        <div
          class="relative mx-auto flex w-full flex-wrap items-start justify-between gap-8"
        >
          <section class="flex min-w-0 flex-1 flex-col gap-16">
            <ContentSection>
              <template #title>
                <SmartTitle i18n-key="product.title" size="2xl" />
              </template>

              <!-- TODO: add skeleton loader when meta.isLoading -->
              <Card class="!p-0">
                <ProductConfig
                  v-if="pendingProduct && !meta?.isLoading"
                  :item="pendingProduct"
                  :model-value="pendingProduct?.id"
                  :no-footer="true"
                  as="div"
                  @resolve="doResolve"
                  @reject="doReject"
                />

                <ConfigSkeleton v-else />
              </Card>
            </ContentSection>
          </section>

          <header
            class="flex w-full flex-col items-start gap-4 sm:sticky sm:top-1 xl:max-w-md"
          >
            <ContentSection :title="t('product.summary.title')">
              <Summary
                v-if="pendingProduct"
                :item="pendingProduct"
                @resolve="doResolve"
              />
            </ContentSection>
          </header>
        </div>

        <!-- small print -->
        <footer
          class="text-emphasis-medium mt-6 flex flex-col space-y-2 px-6 text-xs md:space-y-0 md:px-0"
        >
          <div
            v-for="(term, index) in tm('product.smallprint')"
            :key="index"
            class="leading-snug"
          >
            {{ term }}
          </div>
        </footer>
      </form>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { watch, computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";
import { forEach } from "lodash-es";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useBasketProductsPending,
  useQueryParams,
  useBrand,
  useProductConfig,
  useProductCategories,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import { Card, Layout, Breadcrumb } from "@upmind-automation/upmind-ui";
import ContentSection from "../../components/content/ContentSection.vue";
import ProductConfig from "./components/config/Config.vue";
import Summary from "./components/summary/Summary.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Share from "../../components/navigation/Share.vue";

// --- types
import type { ProductCategory } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved, router } = useRoutingEngine();
const { meta: basketMeta, isReady } = useBasket();
const { productId } = useQueryParams();
const { configure, resolve } = useBasketProductsPending();
const { storefrontUrl, uiCart } = useBrand();
const { getPath } = useProductCategories();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);
const {
  meta,
  stop,
  update,
  service: pendingProduct
} = await configure(productId);

const { product } = useProductConfig(pendingProduct);

const items = computed(() => {
  // Storefront
  const hasCatalogueRoute = router?.hasRoute(ROUTE.CATALOGUE);
  const items: any[] = [
    {
      label: t("product.shop"),
      to: hasCatalogueRoute ? { name: ROUTE.CATALOGUE } : undefined,
      href: !hasCatalogueRoute ? storefrontUrl.value : undefined,
      current: false
    }
  ];

  // Categories
  if (product?.value?.productDetails?.categoryId) {
    const categoryPath = getPath(product.value.productDetails.categoryId);
    forEach(categoryPath, (category: ProductCategory) => {
      items.push({
        label: category.title,
        to: hasCatalogueRoute
          ? {
              name: ROUTE.CATALOGUE,
              query: {
                catid: category.id
              }
            }
          : undefined,
        current: uiCart.value?.catalogue?.disabled || !hasCatalogueRoute
      });
    });
  }

  // Current product
  items.push({
    label: product.value?.productDetails?.title,
    current: true
  });

  return items;
});

async function doResolve() {
  update()
    .then(() => {
      resolve(pendingProduct);
      navigateNext(pendingProduct);
    })
    .catch(() => {
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      watch(
        meta,
        ({ isDone }) => {
          if (isDone) {
            resolve(pendingProduct);
            navigateNext(pendingProduct);
          }
        },
        {
          immediate: true
        }
      );
    });
}

function doReject() {
  stop();
  navigateBack();
}
</script>
