<template>
  <component
    :is="templateVariant"
    v-model:open="open"
    :loading="meta.isLoading || meta.isProcessing"
    @reset="meta.isEmpty ? doReset() : doResolve()"
  >
    <template #hero>
      <DomainHero
        v-model="queryValue"
        :searching="meta.isSearching"
        :type="type"
        :processing="meta.isProcessing || processingBasket"
        @search="search"
        @reset="doReset"
      />
    </template>

    <template #domain-type v-if="meta.showChoices">
      <DomainType
        :disabled="disabled"
        :model-value="modelValue"
        :choices="choices"
        :owned="owned"
        :basket="basket"
        :type="type"
        :query="queryValue"
        :selected="modelValue"
        :showSelected="meta.showSelected"
        :showBasket="meta.showBasket"
        :showDac="meta.showDac"
        :showSearchResults="meta.showSearchResults"
        :showExisting="meta.showExisting"
        @update:model-value="update"
        @update:selected="select"
        @update:type="choose"
        @update:query="value => (queryValue = value || '')"
        @error="onError"
      />
    </template>

    <template #search>
      <DomainSearch
        v-model="queryValue"
        :searching="meta.isSearching"
        :processing="meta.isProcessing || processingBasket"
        :type="type"
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
        :model-value="added"
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

    <template #cancel>
      <Button
        :label="t('action.cancel')"
        variant="subtle"
        size="lg"
        :block="isMobile"
        :disabled="meta.isProcessing || meta.isLoading"
        @click="doReset"
      />
    </template>

    <template #resolve>
      <Button
        :label="t('action.continue_label')"
        variant="solid"
        color="primary"
        size="lg"
        icon-append="arrow-right"
        :disabled="
          meta.isProcessing ||
          meta.isEmpty ||
          meta.isLoading ||
          processingBasket
        "
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
import { useI18n } from "vue-i18n";

// --- internal
import { useDomain, DomainTypes } from "@upmind-automation/headless";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";
import { isMobile } from "@upmind-automation/upmind-ui";

// --- components
import DomainHero from "./components/DomainHero.vue";
import DomainTabs from "./components/DomainTabs.vue";
import DomainCards from "./components/DomainCards.vue";
import DomainSearch from "./components/DomainSearch.vue";
import DomainType from "./components/DomainType.vue";
import { Button } from "@upmind-automation/upmind-ui";

// --- utils
import { DEBOUNCE_DELAY } from "@upmind-automation/headless";
import { debounce } from "lodash-es";

//  --- templates
const supportedTemplates = {
  [DOMAIN_TEMPLATE.DRAWER]: defineAsyncComponent(
    () => import("./templates/DomainDrawer.template.vue")
  )
};

// --- types
import { get } from "lodash-es";
import type { DomainProps } from "./types";
import { DOMAIN_TEMPLATE } from "./types";

// -----------------------------------------------------------------------------
defineOptions({
  inheritAttrs: false
});

const props = withDefaults(defineProps<DomainProps>(), {
  template: DOMAIN_TEMPLATE.DRAWER,
  modelValue: ""
});

const emit = defineEmits<{
  (e: "error", value: string): void;
  (e: "update:modelValue", value: string): void;
  (e: "resolve", value?: string): void;
  (e: "reset"): void;
}>();

const modelValue = defineModel<string>("modelValue");

const { t } = useI18n();

// -----------------------------------------------------------------------------

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
    supportedTemplates[DOMAIN_TEMPLATE.DRAWER]
  )
);

const {
  isReady,
  // --- DAC
  available,
  added,
  searchParams,
  search,
  searchMore,
  remove,
  add,
  // ---
  basket,
  choices,
  meta,
  owned,
  pagination,
  query,
  selected,
  type,
  // ---
  choose,
  errors,
  reset,
  select,
  stop,
  stopDac,
  update
} = useDomain(props.modelValue, {
  type: props.type as DomainTypes
});

// ---------------------------------------------------------------------------

const open = ref(false);
const processingBasket = ref(false);

const resultCount = ref(0);
const queryValue = ref(query.value || "");

const debouncedSearch = debounce(
  (value: string) => search(value),
  DEBOUNCE_DELAY
);

function doResolve() {
  open.value = false;
  processingBasket.value = true;
  stopDac(); // force the reset after adding domain(s)
  emit("resolve", modelValue.value);
}

function doReset() {
  open.value = false;
  processingBasket.value = false;
  resultCount.value = 0;
  queryValue.value = "";
  debouncedSearch.cancel();
  reset();
}

// --- side effects

await isReady().then(() => {
  // NB ensure we sync initial value in case the composable modified it
  modelValue.value = selected.value;
});

watch(queryValue, value => {
  if (!value) {
    debouncedSearch.cancel();
    reset();
  } else {
    debouncedSearch(value);
  }
});

watch(
  searchParams,
  search => {
    if (!search?.query) {
      queryValue.value = "";
    }
  },
  { immediate: true, deep: true }
);

watch(selected, value => (modelValue.value = value));

watch(meta, ({ isSearching, showSearchResults, showDac }) => {
  const shouldOpen = showDac && (showSearchResults || isSearching);
  if (shouldOpen) {
    open.value = true;
    processingBasket.value = false;
  }
});

// Stores the previous result count for smooth skeleton loading
watch(available, previous => {
  resultCount.value = previous?.length ?? 0;
});

function onError(error: string) {
  emit("error", error);
}

onUnmounted(() => {
  stop();
  if (props.template === DOMAIN_TEMPLATE.FULL) {
    useLayout({});
    useFooter({});
    useHeader({});
  }
});
</script>
