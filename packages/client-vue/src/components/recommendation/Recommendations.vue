<template>
  <aside v-auto-animate>
    <UpmBasketLoading
      v-if="isEmpty(recommendationsData) && !mounted"
      class="min-h-screen"
      skrim="light"
      :text="t('basket.loading.text')"
      :animated-icon="{
        icon: 'basket',
        delay: 250,
        primaryColor: 'base-foreground',
        secondaryColor: 'tertiary',
        size: '4xl',
      }"
    >
      <template #title>
        <i18n-t
          keypath="basket.loading.title"
          tag="span"
          for="basket.loading.exciting"
          class="text-primary font-semibold"
        >
          <mask class="bg-accent leading-relaxed">{{
            t("basket.loading.exciting")
          }}</mask>
        </i18n-t>
      </template>
    </UpmBasketLoading>

    <div v-else v-auto-animate>
      <div class="mt-4 flex flex-col items-center justify-center gap-6 p-2">
        <div class="text-center text-4xl font-bold leading-normal">
          {{ t("recommendations.header.title.prefix") }}
          <mask class="bg-accent leading-relaxed">{{
            t("recommendations.header.title.highlight")
          }}</mask>
          {{ t("recommendations.header.title.suffix") }}
        </div>

        <p
          class="text-emphasis-medium m-0 mb-8 max-w-md text-center text-lg leading-normal"
        >
          {{ t("recommendations.header.subtitle") }}
        </p>
      </div>

      <UpmContentSection
        :class="{
          'mx-auto !max-w-xl': recommendations.length === 1,
        }"
      >
        <RecommendationsCarousel
          class="mt-6"
          :recommendations="recommendations"
          :meta="meta"
          @resolve="doResolve"
        />

        <UpmCard
          class="md:bg-base-background mt-8 flex flex-col items-center justify-between bg-transparent !p-0 shadow-none md:mt-8 md:flex-row md:!px-8 md:!py-6 md:shadow-sm"
        >
          <div
            class="text-md order-last mt-4 text-center font-medium md:order-first md:mt-0 md:text-left"
          >
            {{
              t(
                "recommendations.basket.items." +
                  (products.length > 1 ? "multiple" : "single"),
                { count: products.length }
              )
            }}
          </div>
          <RouterLink
            :to="{ name: 'cart' }"
            class="order-first w-full no-underline md:order-last md:ml-auto md:w-auto"
          >
            <Button
              :label="t('recommendations.basket.continue')"
              color="secondary"
              class="w-full md:w-auto"
            >
              <template #append>
                <Icon icon="arrow-right" size="2xs" />
              </template>
            </Button>
          </RouterLink>
        </UpmCard>
      </UpmContentSection>
    </div>

    <!-- <VRequiresAction v-if="resolved && requiresAction" /> -->
  </aside>

  <!-- <pre>{{ recommendationsMeta }}</pre> -->

  <Drawer
    v-if="basketItem"
    to="#vue-app"
    fit="cover"
    skrim="primary"
    :open="recommendationsMeta.isConfiguring"
    :title="t('recommendations.configuration.title')"
    :description="t('recommendations.configuration.description')"
    :dismissible="false"
    class-footer="flex-row items-center justify-between gap-x-4"
  >
    <UpmProductConfig
      :item="basketItem"
      :processing="meta?.isProcessing"
      :model-value="basketItem?.id"
      :no-footer="true"
      @resolve="doUpdate"
      @reject="doCancel"
    />

    <template #close>
      <Button
        @click="doCancel"
        :label="t('recommendations.configuration.actions.reject')"
        variant="link"
        color="primary"
      />
    </template>

    <template #actions>
      <Button
        :loading="meta.isProcessing"
        :disabled="meta.isEmpty || meta.isDisabled || meta.isProcessing"
        @click="doUpdate"
        :label="t('recommendations.configuration.actions.resolve')"
        prependIcon="plus-circle"
        color="primary"
      />
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";
import { isEmpty } from "lodash-es";
import { ref } from "vue";

// --- internal
import {
  useBasket,
  useRecommendationsEngine,
  UpmBasketLoading,
  UpmContentSection,
  UpmProductConfig,
  UpmCard,
} from "@upmind-automation/client-vue";

// --- components
import { Button, Drawer, Icon } from "@upmind-automation/upwind";
import RecommendationsCarousel from "./RecommendationsCarousel.vue";

// --- utils
// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const mounted = ref(false);

// --- basket setup
const {
  meta: recommendationsMeta,
  isReady: isRecommendationsReady,
  recommendations,
  add,
  remove,
  basketItem,
  cancel,
} = useRecommendationsEngine();

const { isReady, meta, updateItem, removeItem, products } = useBasket();

function doClose() {
  // router.replace({ name: "cart" });
}

function doResolve(recommendation: any) {
  if (recommendation.added) {
    remove(recommendation.id);
  } else {
    add(recommendation.id);
  }
}

function doReject() {
  // if were successful, then redirect to the cart
  doClose();
}

function doUpdate(id: string) {
  debugger;
  updateItem(basketItem.value.id).then(() => {
    debugger;
    doClose();
  });
}

function doCancel() {
  debugger;
  removeItem(basketItem.value.id).then(cancel);
}

// wait for thhe basket to be ready and ensure we are available ( ir we have products)
await isReady();
if (meta.value.isAvailable) {
  // then wait for the recommendations to be ready and ensure we have recommendations
  await isRecommendationsReady();
  if (!recommendationsMeta.value.hasRecommendations) doClose();
  mounted.value = true;
} else {
  doClose();
}
</script>
