<template>
  <aside v-auto-animate>
    <UpmBasketLoading
      v-if="recommendationsMeta.isLoading"
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
      <div
        class="mb-16 mt-4 flex items-center justify-center p-2 text-4xl font-bold"
      >
        We
        <mask class="bg-accent mx-2 leading-relaxed">think</mask>
        you may like these
      </div>

      <UpmContentSection>
        <div class="relative w-screen">
          <RecommendationsCarousel
            :recommendations="recommendations"
            :meta="meta"
          />
        </div>
      </UpmContentSection>
    </div>

    <pre>
      {{ recommendations[0] }}
    </pre>

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
import { useRouter } from "vue-router";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRecommendationsEngine,
  UpmBasketLoading,
  UpmContentSection,
  UpmProductConfig,
} from "@upmind-automation/client-vue";

// --- components
import { Button, Drawer } from "@upmind-automation/upwind";
import UpmRecommendationCard from "./RecommendationCard.vue";
import RecommendationsCarousel from "./RecommendationsCarousel.vue";

// --- utils
// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();

// --- basket setup
const {
  meta: recommendationsMeta,
  isReady: isRecommendationsReady,
  recommendations,
  add,
  basketItem,
  cancel,
} = useRecommendationsEngine();

const { isReady, meta, updateItem, removeItem } = useBasket();

function doClose() {
  router.replace({ name: "cart" });
}

function doResolve(id: string) {
  add(id).then(() => {
    // if were successful, then redirect to the cart
    // doClose();
  });
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
} else {
  doClose();
}
</script>
