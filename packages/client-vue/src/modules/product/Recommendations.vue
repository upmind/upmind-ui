<template>
  <Transitions>
    <component :is="templateVariant" :key="props.template">
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
    </component>
  </Transitions>
</template>

<script lang="ts" setup>
// --- external
import { computed, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductRecommendations,
  useQueryParams,
  useRoutingEngine,
  UIContext
} from "@upmind-automation/headless";
import { useConfig, validateTemplate } from "@upmind-automation/headless";
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import Configure from "../recommendations/components/Configure.vue";
import CardsCarousel from "../recommendations/components/CardsCarousel.vue";
import Footer from "../recommendations/components/Footer.vue";
import Hero from "../../components/hero/Hero.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";

// --- templates
const supportedTemplates = {
  [RECOMMENDATIONS_TEMPLATE.FULL]: defineAsyncComponent(
    () =>
      import("../recommendations/templates/RecommendationsFull.template.vue")
  )
};

// --- utils
import { get } from "lodash-es";

// --- types
import { RECOMMENDATIONS_TEMPLATE } from "../recommendations/types";
import type { RecommendationsPageProps } from "../recommendations/types";
// -----------------------------------------------------------------------------

const props = defineProps<RecommendationsPageProps>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { set } = useThemes();

const { ui } = useConfig({
  context: UIContext.RECOMMENDATIONS,
  provide: true
});

set(ui.theme.value);

// --- recommendations setup
const { navigateNext } = useRoutingEngine();
const { productId } = useQueryParams();

const {
  seen,
  isReady,
  failedProduct,
  meta,
  recommendations,
  add,
  fetchRecommendation
} = useProductRecommendations(productId);

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    RECOMMENDATIONS_TEMPLATE,
    RECOMMENDATIONS_TEMPLATE.FULL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

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
