<template>
  <component :is="templateVariant" v-model:open="open">
    <template #hero>
      <DomainHero
        v-model="queryValue"
        :searching="meta.isSearching"
        :type="DomainTypes.register"
        :processing="meta.isProcessing"
        @search="search"
        @reset="doReset"
      />
    </template>

    <template #search>
      <DomainSearch
        v-model="queryValue"
        :searching="meta.isSearching"
        :processing="meta.isProcessing"
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
        :model-value="model"
        :items="available || []"
        :offset="pagination.offset"
        :query="query"
        :processing="meta.isProcessing"
        :loading="meta.isLoading"
        :searching="meta.isSearching"
        :valid="meta.isValid"
        :template="template"
        :result-count="resultCount"
        :skeleton-count="template === DOMAIN_TEMPLATE.DRAWER ? 5 : 3"
        @add="add"
        @remove="remove"
        @search-more="searchMore"
      />
    </template>

    <template #hint v-if="!isMobile">
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
          meta.isEmpty
            ? t('domain.domain_not_required_label')
            : t('action.continue_label')
        "
        variant="solid"
        color="primary"
        size="lg"
        icon-append="arrow-right"
        :disabled="meta.isProcessing || meta.isLoading"
        :block="isMobile || (isMobile && template === DOMAIN_TEMPLATE.WIDGET)"
        @click="doResolve"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed, onUnmounted, ref, watch } from "vue";
import { defineAsyncComponent } from "vue";
import { debounce } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- internal
import { useDac, DomainTypes } from "@upmind-automation/headless";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";
import { isMobile } from "@upmind-automation/upmind-ui";
import { useBasket } from "@upmind-automation/headless";

// --- components
import DomainHero from "./components/DomainHero.vue";
import DomainTabs from "./components/DomainTabs.vue";
import DomainCards from "./components/DomainCards.vue";
import DomainSearch from "./components/DomainSearch.vue";
import { Button } from "@upmind-automation/upmind-ui";

// --- utils
import { utils } from "@upmind-automation/headless";
import { isEmpty } from "lodash-es";

//  --- templates
const supportedTemplates = {
  [DOMAIN_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/DomainFull.template.vue")
  ),
  [DOMAIN_TEMPLATE.WIDGET]: defineAsyncComponent(
    () => import("./templates/DomainWidget.template.vue")
  )
};

// --- types
import { get } from "lodash-es";
import type { DacProps } from "./types";
import { DOMAIN_TEMPLATE } from "./types";

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

const { DEBOUNCE_DELAY } = utils;

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
  lookups,
  available,
  model,
  added,
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

const { count, summary } = useBasket();

// ---------------------------------------------------------------------------

const open = ref(false);
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
  stop();
  emit("resolve", model.value);
}

function doReset() {
  open.value = false;
  resultCount.value = 0;
  queryValue.value = "";
  debouncedSearch.cancel();
  reset();
}

const hasActiveItems = computed(() =>
  available.value?.some(
    item => model.value?.includes(item.domain) && item.meta?.added // must be in current session's model // successfully in basket
  )
);

const showActions = computed(
  () => props.template !== DOMAIN_TEMPLATE.WIDGET || hasActiveItems.value
);

// --- side effects

await isReady();

watch(meta, ({ isSearching, showSearchResults }) => {
  const shouldOpen = showSearchResults || isSearching;
  if (shouldOpen) open.value = true;
});

// Stores the previous result count for smooth skeleton loading
watch(available, previous => {
  resultCount.value = previous?.length ?? 0;
});

onUnmounted(() => {
  stop();
  if (props.template === DOMAIN_TEMPLATE.FULL) {
    useLayout({});
    useFooter({});
    useHeader({});
  }
});
</script>
