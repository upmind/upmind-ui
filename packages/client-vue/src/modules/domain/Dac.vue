<template>
  <component
    :is="templateVariant"
    v-model:open="open"
    :loading="meta.isLoading"
  >
    <template #hero>
      <DomainHero
        v-model="queryValue"
        :searching="meta.isSearching"
        :type="DomainTypes.register"
        :processing="meta.isProcessing || processingBasket"
        @search="search"
        @reset="doReset"
      />
    </template>

    <template #search>
      <DomainSearch
        v-model="queryValue"
        :searching="meta.isSearching"
        :processing="meta.isProcessing || processingBasket"
        :type="DomainTypes.register"
        @search="search"
        @reset="doReset"
      />
    </template>

    <template #tabs>
      <DomainTabs />
    </template>

    <template #results>
      <DomainCards
        :disabled="processingBasket"
        :model-value="model"
        :items="available || []"
        :offset="pagination.offset"
        :has-more="meta.hasMoreSearchResults"
        :query="query"
        :processing="meta.isProcessing"
        :loading="meta.isLoading"
        :searching="meta.isSearching"
        :searching-more="meta.isSearchingMore"
        :valid="meta.isValid"
        :template="template"
        :result-count="resultCount"
        :skeleton-count="template === DOMAIN_TEMPLATE.DRAWER ? 5 : 3"
        @add="add"
        @remove="remove"
        @search-more="searchMore"
      />
    </template>

    <template #hint v-if="!isMobile && showActions">
      <p class="text-md text-muted">
        <template v-if="!count">
          {{ t("text.cant_decide_right_qn") }}
        </template>
        <template v-else-if="summary?.total">
          {{ t("cart.basket_summary_desc", { count, total: summary?.total }) }}
        </template>
      </p>
    </template>

    <template #resolve>
      <Button
        v-if="showActions"
        :label="
          meta.isEmpty && !meta.hasAdded
            ? t('domain.domain_not_required_label')
            : t('action.continue_label')
        "
        :loading="processingBasket"
        variant="solid"
        color="primary"
        size="lg"
        icon-append="arrow-right"
        :disabled="meta.isProcessing || processingBasket"
        :block="isMobile || (isMobile && template === DOMAIN_TEMPLATE.WIDGET)"
        @click="doResolve"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDac, DomainTypes } from "@upmind-automation/headless";
import {
  useBasket,
  useBasketCurrency,
  useQuery
} from "@upmind-automation/headless";
import { DEBOUNCE_DELAY } from "@upmind-automation/headless";
import { isMobile } from "@upmind-automation/upmind-ui";
import { Button } from "@upmind-automation/upmind-ui";
import DomainCards from "./components/DomainCards.vue";
import DomainHero from "./components/DomainHero.vue";
import DomainSearch from "./components/DomainSearch.vue";
import DomainTabs from "./components/DomainTabs.vue";
import DomainFullTemplate from "./templates/DomainFull.template.vue";
import DomainWidgetTemplate from "./templates/DomainWidget.template.vue";
import { DOMAIN_TEMPLATE } from "./types";
import { debounce, includes, some } from "lodash-es";
import { get } from "lodash-es";
import type { DacProps } from "./types";

const supportedTemplates = {
  [DOMAIN_TEMPLATE.FULL]: DomainFullTemplate,
  [DOMAIN_TEMPLATE.WIDGET]: DomainWidgetTemplate
};

// -----------------------------------------------------------------------------
defineOptions({
  inheritAttrs: false
});

const props = withDefaults(defineProps<DacProps>(), {
  template: DOMAIN_TEMPLATE.FULL
});

const emit = defineEmits<{
  (e: "resolve", value?: string[]): void;
  (e: "reset"): void;
}>();

const { t } = useI18n();

// -----------------------------------------------------------------------------

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
    supportedTemplates[DOMAIN_TEMPLATE.FULL]
  )
);

const {
  isReady,
  available,
  model,
  added: _added,
  search,
  meta,
  pagination,
  query,
  searchMore,
  remove,
  add,
  reset,
  stop
} = useDac();
// } = useDac({ useSuggestions: false });

const { count, summary, meta: basketMeta } = useBasket();
const { currencyCode } = useBasketCurrency();
const { queryClient } = useQuery();

// ---------------------------------------------------------------------------

const open = ref(false);
const processingBasket = ref(false);

const resultCount = ref(0);
const queryValue = ref(query.value || "");

const debouncedSearch = debounce(
  (value: string) => search(value),
  DEBOUNCE_DELAY
);

watch(queryValue, value => {
  if (!value) {
    debouncedSearch.cancel();
    reset();
  } else {
    debouncedSearch(value);
  }
});

function doResolve() {
  open.value = false;
  processingBasket.value = true;

  stop();
  emit("resolve", model.value);
}

function doReset() {
  open.value = false;
  processingBasket.value = false;
  resultCount.value = 0;
  queryValue.value = "";
  debouncedSearch.cancel();
  reset();
}

const hasActiveItems = computed(() =>
  some(
    available.value,
    item => includes(model.value, item.domain) && item.meta?.added // must be in current session's model // successfully in basket
  )
);

const showActions = computed(
  () =>
    !basketMeta.value.isLoading &&
    (props.template !== DOMAIN_TEMPLATE.WIDGET || hasActiveItems.value)
);

// --- side effects

await isReady();

watch(meta, ({ isSearching, showSearchResults }) => {
  const shouldOpen = showSearchResults || isSearching;
  if (shouldOpen) {
    open.value = true;
    processingBasket.value = false; // Reset processingBasket when reopening DAC
  }
});

// Stores the previous result count for smooth skeleton loading
watch(available, previous => {
  resultCount.value = previous?.length ?? 0;
});

// Re-trigger search when currency changes so prices update
watch(currencyCode, (newCode, oldCode) => {
  if (newCode && oldCode && newCode !== oldCode && queryValue.value) {
    // Invalidate cached domain queries so fresh prices are fetched
    queryClient.removeQueries({ queryKey: ["domains"] });
    search(queryValue.value);
  }
});

onUnmounted(() => {
  stop();
});
</script>
