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
      <div class="mt-4 flex flex-col items-center justify-center gap-6 p-2">
        <div class="text-center text-4xl font-bold leading-normal">
          Frequently
          <mask class="bg-accent leading-relaxed">bought</mask>
          together
        </div>

        <p
          class="text-emphasis-medium m-0 mb-8 max-w-md text-center text-lg leading-normal"
        >
          These products are popular additions among customers who made a
          similar selection
        </p>
      </div>

      <UpmContentSection>
        <RecommendationsCarousel
          :recommendations="recommendationsData"
          :meta="meta"
          @resolve="doResolve"
        />
      </UpmContentSection>
    </div>

    <div class="mt-10 justify-end md:flex">
      <RouterLink :to="{ name: 'cart' }" class="no-underline md:ml-auto">
        <Button
          label="Continue to Basket"
          color="secondary"
          class="w-full md:w-auto"
        >
          <template #append>
            <Icon icon="arrow-right" size="2xs" />
          </template>
        </Button>
      </RouterLink>
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

// --- internal
import {
  useBasket,
  useRecommendationsEngine,
  UpmBasketLoading,
  UpmContentSection,
  UpmProductConfig,
} from "@upmind-automation/client-vue";

// --- components
import { Button, Drawer, Icon } from "@upmind-automation/upwind";
import UpmRecommendationCard from "./RecommendationCard.vue";
import RecommendationsCarousel from "./RecommendationsCarousel.vue";

// --- utils
// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

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

const recommendationsData = computed(() => {
  if ("mock" in route.query) {
    var firstValues = recommendations.value.map(rec => ({
      ...rec,
      name:
        rec.name === "Ideation Session"
          ? "This is an extra long example to push the badge up"
          : rec.name,
      description:
        rec.name === "Ideation Session"
          ? "Delete the badge and you can see all recommendation card heights readjust to be the same ............................................................"
          : "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco",
      monthlyFromCurrentAmount: 99.99,
      monthlyFromCurrentPrice: "$99.99",
      monthlyFromRegularPrice: "$199.99",
      monthlyFromRegularAmount: 199.99,
      meta: {
        free: false,
        discounted: true,
      },
      promotions: [
        {
          currentSaving: "50%",
          currentSavingAmount: "$100",
        },
      ],
    }));

    var regularValues = recommendations.value.map(rec => ({
      ...rec,
      name: rec.name,
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco",
      monthlyFromCurrentAmount: 99.99,
      monthlyFromCurrentPrice: "$99.99",
      monthlyFromRegularPrice: "$199.99",
      monthlyFromRegularAmount: 199.99,
      meta: {
        free: false,
        discounted: true,
      },
      promotions: [
        {
          currentSaving: "50%",
          currentSavingAmount: "$100",
        },
      ],
    }));

    return [
      ...firstValues,
      ...regularValues,
      ...regularValues,
      ...regularValues,
      ...regularValues,
    ];
  }

  return recommendations.value;
});

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
