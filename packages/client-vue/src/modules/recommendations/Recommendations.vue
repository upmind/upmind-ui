<template>
  <Layout overflow="hidden">
    <template #content-header>
      <Hero
        :title="t('text.complete_online_toolkit_md')"
        :description="t('text.popular_offers')"
      />
    </template>

    <template #default>
      <Interstitial
        v-if="!meta.hasRecommendations"
        open
        modal
        :title="t('cart.recommendations_unavailable_title_md')"
        :text="t('cart.recommendations_unavailable_text')"
        :actions="[
          {
            handler: navigateNext,
            variant: 'solid',
            color: 'primary',
            iconAppend: 'arrow-right',
            label: t('action.continue_label')
          }
        ]"
      >
      </Interstitial>

      <template v-else>
        <CardsCarousel
          :loading="meta?.isLoading"
          :processing="meta?.isProcessing"
          :refreshing="meta?.isRefreshing"
          :items="recommendations"
          @resolve="doAdd"
          @fetch="fetchRecommendation"
          :configure-route="props.configureRoute"
        />

        <Configure
          v-if="basketItem?.id"
          :modelValue="basketItem"
          @resolve="doClose"
        />

        <section
          class="md:bg-control-surface md:border-surface control-radius mt-8 flex flex-col items-center justify-between bg-transparent p-0 md:mt-8 md:flex-row md:border md:px-8 md:py-6"
        >
          <div
            class="text-md order-last mt-4 text-center font-medium md:order-first md:mt-0 md:text-left"
          >
            {{ t("cart.basket_items", { count: count ?? 0 }) }}
          </div>

          <Button
            @click="doClose"
            :label="t('action.continue_label')"
            color="primary"
            size="lg"
            class="w-full md:w-auto"
            iconAppend="arrow-right"
          />
        </section>
      </template>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRecommendations,
  useRoutingEngine,
  UIContext
} from "@upmind-automation/headless";
import { useLayout } from "../../components/layout/useLayout";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useThemes } from "@upmind-automation/upmind-ui";
import { useConfig } from "@upmind-automation/headless";

// --- components
import { Button, Interstitial } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import Configure from "./components/Configure.vue";
import CardsCarousel from "./components/CardsCarousel.vue";
import Hero from "../../components/hero/Hero.vue";
import type { LAYOUT_VARIANTS } from "../../";
import { LAYOUT_OVERFLOW } from "../../components/layout/types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  configureRoute: RouteLocationAsRelativeGeneric;
  layout?: LAYOUT_VARIANTS;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { set } = useThemes();

const { ui } = useConfig({
  context: UIContext.RECOMMENDATIONS
});

set(ui.theme.value);

// --- basket setup
const { navigateNext } = useRoutingEngine();

const { count } = useBasket();
const {
  seen,
  isReady,
  basketItem,
  meta,
  recommendations,
  add,
  fetchRecommendation
} = useRecommendations();

useHeader({});
useLayout({
  overflow: LAYOUT_OVERFLOW.HIDDEN
});
useFooter({});

await isReady();

// ---

function doAdd(value: string) {
  add(value).then(() => doClose());
}
function doClose() {
  seen();
  navigateNext();
}
</script>
