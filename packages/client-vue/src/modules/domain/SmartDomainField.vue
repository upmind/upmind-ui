<template>
  <!-- Summary mode -->
  <SmartDomainSummary
    v-if="meta.showSummary && !isEditing"
    :domain="model ?? ''"
    @change="onChangeClick"
  />

  <!-- Edit mode -->
  <div v-else :class="styles.field.root">
    <RadioGroup
      :model-value="type"
      :disabled="props.disabled"
      @update:model-value="onChoose"
    >
      <div :class="styles.field.container">
        <div :class="styles.field.content">
          <template v-for="choice in sortedChoices" :key="choice.value">
            <!-- Radio option row -->
            <div
              :class="styles.field.option"
              @click="!props.disabled && onChoose(choice.value)"
            >
              <div :class="styles.field.indicator">
                <RadioGroupItem :value="choice.value" />
              </div>
              <label :class="styles.field.label">
                {{ choiceLabel(choice.value) }}
              </label>
            </div>

            <!-- Sub-content: Register -->
            <div
              v-if="
                choice.value === DomainTypes.register &&
                type === DomainTypes.register
              "
              :class="styles.field.subContent"
            >
              <Input
                v-if="!isDrawerOpen"
                :model-value="queryValue"
                :placeholder="t('domain.search')"
                icon-append="arrow-right"
                @update:model-value="onRegisterInput"
                @focus="openDrawer"
              />
              <FormMessage
                v-if="hasVisibleErrors"
                form-message-id="domain-register-error"
                name="domain"
                :errors="props.errors!"
                show-all-errors
              />
            </div>

            <!-- Sub-content: Existing -->
            <div
              v-if="
                choice.value === DomainTypes.existing &&
                type === DomainTypes.existing
              "
              :class="styles.field.subContent"
            >
              <SmartDomainExisting
                :model-value="model ?? null"
                :owned="owned"
                :filtered-owned="filteredOwned"
                :is-domain-like="isDomainLike"
                :validating="meta.isExistingValidating"
                :checked="meta.isExistingChecked"
                :registerable="meta.isExistingRegisterable"
                :registering="meta.isExistingRegistering"
                :transferred="meta.isExistingTransferred"
                :transferring="meta.isExistingTransferring"
                :removing="meta.isExistingRemoving"
                :unavailable="meta.isExistingUnavailable"
                :dns-only="meta.isExistingValid || meta.isExistingError"
                :transfer-price="pricing?.price ?? ''"
                :register-price="pricing?.price ?? ''"
                :cycle="pricing?.cycle"
                @update:model-value="onExistingUpdate"
                @add-transfer="addTransfer"
                @remove-transfer="removeTransfer"
                @add-registration="addRegistration"
              />
              <FormMessage
                v-if="hasVisibleErrors"
                form-message-id="domain-existing-error"
                name="domain"
                :errors="props.errors!"
                show-all-errors
              />
            </div>

            <!-- Sub-content: Basket -->
            <div
              v-if="
                choice.value === DomainTypes.basket &&
                type === DomainTypes.basket
              "
              :class="styles.field.subContent"
            >
              <Select
                :model-value="model"
                :items="basketItems"
                :placeholder="t('domain.basket_placeholder')"
                @update:model-value="onBasketSelect"
              />
              <FormMessage
                v-if="hasVisibleErrors"
                form-message-id="domain-basket-error"
                name="domain"
                :errors="props.errors!"
                show-all-errors
              />
            </div>
          </template>
        </div>
      </div>
    </RadioGroup>

    <!-- Register drawer -->
    <DomainDrawer
      v-model:open="isDrawerOpen"
      :loading="meta.isSearching || meta.isProcessing"
      @reset="meta.isEmpty ? doReset() : doResolve()"
    >
      <template #domain-type />

      <template #search>
        <DomainSearch
          v-model="queryValue"
          :searching="meta.isSearching"
          :processing="meta.isProcessing"
          :type="type"
          @search="search"
          @reset="doReset"
        />
      </template>

      <template #results>
        <DomainCards
          :model-value="added"
          :items="available || []"
          :offset="pagination.offset"
          :query="query"
          :processing="meta.isProcessing"
          :loading="meta.isLoading"
          :searching="meta.isSearching"
          :valid="meta.isValid"
          :template="DOMAIN_TEMPLATE.DRAWER"
          :result-count="resultCount"
          :skeleton-count="5"
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
          :block="isMobileView"
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
          :disabled="meta.isProcessing || meta.isEmpty || meta.isLoading"
          :block="isMobileView"
          @click="doResolve"
        />
      </template>
    </DomainDrawer>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, onUnmounted, ref, watch, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useDomain,
  DomainTypes,
  DEBOUNCE_DELAY,
  type DomainChoice
} from "@upmind-automation/headless";
import {
  RadioGroup,
  RadioGroupItem,
  Input,
  Button,
  Select,
  FormMessage,
  useStyles,
  isMobile
} from "@upmind-automation/upmind-ui";
import type { SelectItemProps } from "@upmind-automation/upmind-ui";

// --- components
import SmartDomainSummary from "./components/SmartDomainSummary.vue";
import SmartDomainExisting from "./components/SmartDomainExisting.vue";
import DomainCards from "./components/DomainCards.vue";
import DomainSearch from "./components/DomainSearch.vue";
import config from "./smartDomainField.config";
import { DOMAIN_TEMPLATE } from "./types";

// --- utils
import { debounce, filter, map, sortBy, indexOf } from "lodash-es";

// --- templates
const DomainDrawer = defineAsyncComponent(
  () => import("./templates/DomainDrawer.template.vue")
);

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const props = defineProps<{
  modelValue?: string | null;
  disabled?: boolean;
  required?: boolean;
  errors?: string[];
  touched?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "resolve", value?: string | null): void;
  (e: "error", value: string): void;
}>();

const { t, tm, rt } = useI18n();
const stylesMeta = computed(() => ({
  hasTransferInfo:
    meta.value.isExistingChecked ||
    meta.value.isExistingRegisterable ||
    meta.value.isExistingRegistering ||
    meta.value.isExistingTransferred ||
    meta.value.isExistingTransferring ||
    meta.value.isExistingRemoving ||
    meta.value.isExistingValid ||
    meta.value.isExistingError
}));
const styles = useStyles(
  ["field", "field.summary", "field.transfer"],
  stylesMeta,
  config
);
const isMobileView = isMobile;

const hasVisibleErrors = computed(
  () => !!(props.touched && props.errors?.length)
);

// --- Canonical choices order (Figma)
const SMART_DOMAIN_CHOICES_ORDER = [
  DomainTypes.skip,
  DomainTypes.register,
  DomainTypes.existing,
  DomainTypes.basket
];

// --- Composable

const {
  isReady,
  available,
  added,
  searchParams,
  search,
  searchMore,
  remove,
  add,
  basket,
  choices,
  meta,
  model,
  pagination,
  query,
  selected,
  type,
  choose,
  errors,
  reset,
  select,
  stop,
  stopDac,
  update,
  pricing,
  addTransfer,
  addRegistration,
  removeTransfer,
  clearExisting,
  isDomainLike,
  owned,
  filteredOwned
} = useDomain(props.modelValue ?? "", {
  type: undefined,
  required: props.required
});

// --- State

const isEditing = ref(false);
const isDrawerOpen = ref(false);
const resultCount = ref(0);
const queryValue = ref(query.value || "");

// --- Sorted and filtered choices

const sortedChoices = computed(() => {
  const filtered = filter(
    choices.value,
    (c: DomainChoice) => c.value !== DomainTypes.transfer
  );
  return sortBy(filtered, (c: DomainChoice) =>
    indexOf(SMART_DOMAIN_CHOICES_ORDER, c.value)
  );
});

function choiceLabel(value: DomainTypes): string {
  const translations: { label?: string } = tm(`domain.choices.${value}`);
  return rt(translations?.label ?? "") || value;
}

// --- Basket items for Select

const basketItems = computed((): SelectItemProps[] =>
  map(basket.value, (item, index) => ({
    index,
    item,
    value: item.domain?.toString(),
    label: item.domain?.toString() ?? ""
  }))
);

// --- Search debounce (single pipeline)

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

// --- Methods

function onChoose(value: string | DomainTypes) {
  isEditing.value = true;
  choose(value);
}

function onRegisterInput(value: string | number | undefined) {
  queryValue.value = value?.toString() ?? "";
}

function openDrawer() {
  isDrawerOpen.value = true;
}

function onExistingUpdate(value: string) {
  if (value) {
    update(value);
  } else {
    clearExisting();
  }
}

function onBasketSelect(value: string) {
  if (value) {
    select(value);
  }
}

function doResolve() {
  isDrawerOpen.value = false;
  stopDac();
  isEditing.value = false;
}

function doReset() {
  isDrawerOpen.value = false;
  resultCount.value = 0;
  queryValue.value = "";
  debouncedSearch.cancel();
  reset();
}

function onChangeClick() {
  isEditing.value = true;
}

// --- Side effects

await isReady();

// Sync model → emit
watch(selected, value => {
  emit("update:modelValue", value ?? null);
});

// Skip state → emit null
watch(
  () => meta.value.isSkip,
  isSkip => {
    if (isSkip) {
      emit("update:modelValue", null);
    }
  }
);

// Open drawer when search starts
watch(meta, ({ isSearching, showSearchResults, showDac }) => {
  const shouldOpen = showDac && (showSearchResults || isSearching);
  if (shouldOpen) {
    isDrawerOpen.value = true;
  }
});

// Track result count for skeleton loading
watch(available, previous => {
  resultCount.value = previous?.length ?? 0;
});

// Sync search params reset
watch(
  searchParams,
  s => {
    if (!s?.query) {
      queryValue.value = "";
    }
  },
  { immediate: true, deep: true }
);

onUnmounted(() => {
  stop();
});
</script>
