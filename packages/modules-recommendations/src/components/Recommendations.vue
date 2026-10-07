<template>
  <LayoutProvider>
    <slot :template="ui.template.value" />

    <template #hero>
      <slot name="hero">
        <Hero
          :title="t('text.complete_online_toolkit_md')"
          :subtitle="t('text.popular_offers')"
        />
      </slot>
    </template>

    <template #cards>
      <Interstitial
        :close-label="t('action.close')"
        v-if="!meta.hasRecommendations"
        open
        modal
        :title="t('cart.recommendations_unavailable_title_md')"
        :text="t('cart.recommendations_unavailable_text')"
        :animated-icon="{ icon: 'basket', size: 'xl' }"
      >
        <template #actions>
          <Button variant="primary" size="lg" @click="navigateNext">
            {{ t("action.continue_label") }}
            <Icon icon="arrow-right" />
          </Button>
        </template>
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
      </template>
    </template>

    <template #configure>
      <Configure
        v-if="meta.isConfiguring && failedProduct"
        :modelValue="failedProduct"
        @resolve="doClose"
      />
    </template>

    <template v-if="meta.hasRecommendations" #footer>
      <Footer @skip="doClose" />
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { Interstitial, Button } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Hero } from "@upmind-automation/foundation";
import { Icon } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import {
  useRecommendations,
  useRoutingEngine,
  UIContext
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import CardsCarousel from "./CardsCarousel.vue";
import Configure from "./Configure.vue";
import Footer from "./Footer.vue";
import type { RecommendationsPageProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<RecommendationsPageProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { ui } = useConfig({
  context: UIContext.RECOMMENDATIONS,
  provide: true
});

// --- recommendations setup
const { navigateNext } = useRoutingEngine();

const {
  seen,
  isReady,
  failedProduct,
  meta,
  recommendations,
  add,
  fetchRecommendation
} = useRecommendations();

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
