<template>
  <!-- Summary mode -->
  <SmartDomainSummary
    v-if="meta.showSummary"
    :domain="model ?? ''"
    :disabled="props.disabled"
    @change="onChangeClick"
  />

  <!-- Edit mode -->
  <div v-else :class="fieldRootVariants()">
    <RadioGroup
      :model-value="type"
      :disabled="props.disabled"
      :items="radioChoices"
      :class="[fieldContainerVariants(), fieldContentVariants()]"
      :data-disabled="props.disabled || undefined"
      :aria-invalid="showError || undefined"
      :ui="{
        option: fieldOptionVariants(),
        control: fieldIndicatorVariants(),
        label: fieldLabelVariants(),
        expanded: fieldExpandedVariants({ hasInfo: domainMeta.hasInfo })
      }"
      @update:model-value="onChoose"
    >
      <template #expanded>
        <!-- Register -->
        <template v-if="type === DomainTypes.register">
          <FormControl
            v-if="!open"
            form-item-id="domain-register-search"
            :auto-focus="meta.shouldAutoFocus"
          >
            <Input
              size="lg"
              :model-value="queryValue"
              :placeholder="t('domain.search')"
              :disabled="props.disabled"
              @update:model-value="onRegisterInput"
              @focus="openDrawer"
            >
              <template #trailing><Icon icon="arrow-right" /></template>
            </Input>
          </FormControl>
          <FormMessage
            v-if="showError"
            form-message-id="domain-register-error"
            name="domain"
            :errors="props.errors!"
            show-all-errors
          />
        </template>

        <!-- Existing -->
        <template v-if="type === DomainTypes.existing">
          <SmartDomainExisting
            :model-value="model ?? null"
            :owned="owned"
            :filtered-owned="filteredOwned"
            :is-domain-like="isDomainLike"
            :disabled="props.disabled"
            :validating="domainMeta.isExistingValidating"
            :checked="domainMeta.isExistingChecked"
            :registerable="domainMeta.isExistingRegisterable"
            :registering="domainMeta.isExistingPendingRegistration"
            :transferred="domainMeta.isExistingTransferred"
            :transferring="domainMeta.isExistingPendingTransfer"
            :removing="domainMeta.isExistingRemoving"
            :unavailable="domainMeta.isExistingUnavailable"
            :dns-only="
              domainMeta.isExistingValid ||
              domainMeta.isExistingError ||
              domainMeta.isExistingOwned
            "
            :transfer-price="pricing?.price ?? ''"
            :renewal-price="pricing?.regularPrice ?? ''"
            :transfer-option-price="pricing?.transferOptionPrice"
            :transfer-option-is-free="pricing?.transferOptionIsFree"
            :register-price="pricing?.price ?? ''"
            :cycle="pricing?.cycle"
            @update:model-value="onExistingUpdate"
            @add-transfer="addTransfer"
            @remove-transfer="removeTransfer"
            @add-registration="addRegistration"
          />
          <FormMessage
            v-if="showError"
            form-message-id="domain-existing-error"
            name="domain"
            :errors="props.errors!"
            show-all-errors
          />
        </template>

        <!-- Basket -->
        <template v-if="type === DomainTypes.basket">
          <Select
            :model-value="model ?? undefined"
            :items="basketItems"
            :placeholder="t('domain.basket_placeholder')"
            :disabled="props.disabled"
            size="lg"
            class="w-full"
            @update:model-value="onBasketSelect"
          />
          <FormMessage
            v-if="showError"
            form-message-id="domain-basket-error"
            name="domain"
            :errors="props.errors!"
            show-all-errors
          />
        </template>
      </template>
    </RadioGroup>

    <!-- Register drawer -->
    <SmartDomainDrawer
      v-model:open="open"
      v-model:query="queryValue"
      :search-query="query"
      :type="type"
      :added="added"
      :available="available || []"
      :offset="pagination.offset"
      :result-count="resultCount"
      :searching="domainMeta.isSearching"
      :processing="domainMeta.isProcessing"
      :loading="meta.isLoading"
      :disabled="props.disabled"
      :valid="domainMeta.isValid"
      :empty="domainMeta.isEmpty"
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
import { Input, RadioGroup, Select } from "@upmind/ui";
import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  useBasket,
  useDomain,
  DomainTypes,
  DEBOUNCE_DELAY,
  type DomainChoice
} from "@upmind-automation/headless";
import { FormControl, FormMessage } from "../../components/form";
import { Icon } from "../../components/icon";
import SmartDomainDrawer from "./components/SmartDomainDrawer.vue";
import SmartDomainExisting from "./components/SmartDomainExisting.vue";
import SmartDomainSummary from "./components/SmartDomainSummary.vue";
import {
  fieldRootVariants,
  fieldContainerVariants,
  fieldContentVariants,
  fieldOptionVariants,
  fieldIndicatorVariants,
  fieldLabelVariants,
  fieldExpandedVariants
} from "./smartDomainField.variants";
import {
  SMART_DOMAIN_CHOICES_ORDER,
  type SmartDomainFieldProps
} from "./types";
import { debounce, map, sortBy, indexOf } from "lodash-es";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

const props = defineProps<SmartDomainFieldProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const { t, tm, rt } = useI18n();

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
  meta: domainMeta,
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
  required: props.required,
  tlds: props.tlds
});

const { meta: basketMeta } = useBasket();

// --- State
const editing = ref(false);
const open = ref(false);
const resultCount = ref(0);
const queryValue = ref(query.value || "");

const meta = computed(() => ({
  shouldAutoFocus: !queryValue.value,
  isLoading: domainMeta.value.isLoading || basketMeta.value.isProcessing,
  // errors raised before a save are re-evaluated against a moving baseline
  // while the basket catches up, so they briefly resurface after being fixed
  hasErrors: !!props.errors?.length && !basketMeta.value.isProcessing,
  showSummary:
    domainMeta.value.showSummary &&
    !editing.value &&
    (basketMeta.value.isProcessing || !props.errors?.length)
}));

// --- Sorted and filtered choices
const sortedChoices = computed(() =>
  sortBy(choices.value, (c: DomainChoice) =>
    indexOf(SMART_DOMAIN_CHOICES_ORDER, c.value)
  )
);

const radioChoices = computed(() =>
  map(sortedChoices.value, choice => ({
    value: choice.value,
    label: rt(tm(`domain.choices.${choice.value}`).label)
  }))
);

// Show the field error only once touched. The form marks the field touched
// (validationMode → ValidateAndShow) when there's an outstanding error or the
// user submits — so a pristine required field stays quiet until then.
const showError = computed(() => !!props.touched && meta.value.hasErrors);

// --- Basket items for Select
const basketItems = computed((): { value: string; label: string }[] =>
  map(basket.value, item => ({
    value: item.domain?.toString() ?? "",
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
function onChoose(value: unknown) {
  editing.value = true;
  choose(String(value));
}

function onRegisterInput(value: string | number | undefined) {
  queryValue.value = value?.toString() ?? "";
}

function onExistingUpdate(value: string) {
  if (value) {
    update(value);
  } else {
    clearExisting();
  }
}

function onBasketSelect(value: unknown) {
  if (value) {
    select(String(value));
  }
}

function openDrawer() {
  open.value = true;
}

function doResolve() {
  open.value = false;
  stopDac();
  editing.value = false;
}

function doReset() {
  open.value = false;
  resultCount.value = 0;
  queryValue.value = "";
  debouncedSearch.cancel();
  reset();
}

function onChangeClick() {
  editing.value = true;
  change();
}

// --- Side effects
await isReady();

// Sync model → emit
watch(selected, value => {
  emit("update:modelValue", value ?? null);
});

// Ensures null is emitted on skip even when no domain was ever selected
// (selected stays undefined, so watch(selected) won't fire).
watch(
  () => domainMeta.value.isSkip,
  isSkip => {
    if (isSkip) emit("update:modelValue", null);
  }
);

// Open drawer when machine enters searching or has results
watch(domainMeta, ({ isSearching, showSearchResults, showDac }) => {
  if (showDac && (showSearchResults || isSearching)) {
    open.value = true;
  }
});

watch(available, previous => {
  resultCount.value = previous?.length ?? 0;
});

// Show summary after domain is added to basket via registration
watch(
  () => domainMeta.value.isExistingValid,
  valid => {
    if (valid) {
      editing.value = false;
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
