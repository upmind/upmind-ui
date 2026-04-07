<template>
  <!-- Summary mode -->
  <SmartDomainSummary
    v-if="meta.showSummary && !isEditing"
    :domain="model ?? ''"
    :disabled="props.disabled"
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
              v-if="choice.value === type && type === DomainTypes.register"
              :class="styles.field.expanded"
            >
              <Input
                v-if="!isDrawerOpen"
                :model-value="queryValue"
                :placeholder="t('domain.search')"
                :disabled="props.disabled"
                icon-append="arrow-right"
                @update:model-value="onRegisterInput"
                @focus="openDrawer"
              />
              <FormMessage
                v-if="!!(props.touched && props.errors?.length)"
                form-message-id="domain-register-error"
                name="domain"
                :errors="props.errors!"
                show-all-errors
              />
            </div>

            <!-- Sub-content: Existing -->
            <div
              v-if="choice.value === type && type === DomainTypes.existing"
              :class="styles.field.expanded"
            >
              <SmartDomainExisting
                :model-value="model ?? null"
                :owned="owned"
                :filtered-owned="filteredOwned"
                :is-domain-like="isDomainLike"
                :disabled="props.disabled"
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
                v-if="!!(props.touched && props.errors?.length)"
                form-message-id="domain-existing-error"
                name="domain"
                :errors="props.errors!"
                show-all-errors
              />
            </div>

            <!-- Sub-content: Basket -->
            <div
              v-if="choice.value === type && type === DomainTypes.basket"
              :class="styles.field.expanded"
            >
              <Select
                :model-value="model"
                :items="basketItems"
                :disabled="props.disabled"
                :placeholder="t('domain.basket_placeholder')"
                @update:model-value="onBasketSelect"
              />
              <FormMessage
                v-if="!!(props.touched && props.errors?.length)"
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
    <SmartDomainDrawer
      v-model:open="isDrawerOpen"
      v-model:query="queryValue"
      :search-query="query"
      :type="type"
      :added="added"
      :available="available || []"
      :offset="pagination.offset"
      :result-count="resultCount"
      :searching="meta.isSearching"
      :processing="meta.isProcessing"
      :loading="meta.isLoading"
      :valid="meta.isValid"
      :empty="meta.isEmpty"
      @search="search"
      @search-more="searchMore"
      @add="add"
      @remove="remove"
      @reset="doReset"
      @resolve="doResolve"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, onUnmounted, ref, watch } from "vue";
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
  Select,
  FormMessage,
  useStyles
} from "@upmind-automation/upmind-ui";
import type { SelectItemProps } from "@upmind-automation/upmind-ui";

// --- components
import SmartDomainSummary from "./components/SmartDomainSummary.vue";
import SmartDomainExisting from "./components/SmartDomainExisting.vue";
import SmartDomainDrawer from "./components/SmartDomainDrawer.vue";
import config from "./smartDomainField.config";
import {
  SMART_DOMAIN_CHOICES_ORDER,
  type SmartDomainFieldProps
} from "./types";

// --- utils
import { debounce, filter, map, sortBy, indexOf } from "lodash-es";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const props = defineProps<SmartDomainFieldProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const { t, tm, rt } = useI18n();

const stylesMeta = computed(() => ({
  hasInfo: meta.value.hasInfo
}));

const styles = useStyles(
  ["field", "field.summary", "field.transfer"],
  stylesMeta,
  config
);

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
  change,
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
  change();
}

// --- Side effects
await isReady();

// Sync model → emit
watch(selected, value => {
  emit("update:modelValue", value ?? null);
});

// Skip state → emit null to clear the field
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

// Show summary after domain is added to basket via registration
watch(
  () => meta.value.isExistingValid,
  valid => {
    if (valid) {
      isEditing.value = false;
    }
  }
);

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
