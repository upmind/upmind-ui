<template>
  <!-- Summary mode -->
  <SmartDomainSummary
    v-if="domainMeta.showSummary && !editing && !props.errors?.length"
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
      <div
        :class="styles.field.container"
        :data-disabled="props.disabled || undefined"
        :aria-invalid="showError || undefined"
      >
        <div :class="styles.field.content">
          <template v-for="choice in sortedChoices" :key="choice.value">
            <!-- Radio option row -->
            <div
              :class="styles.field.option"
              @click="!props.disabled && onChoose(choice.value)"
            >
              <div :class="styles.field.indicator">
                <RadioGroupItem :id="choice.value" :value="choice.value" />
              </div>
              <label :for="choice.value" :class="styles.field.label">
                {{ rt(tm(`domain.choices.${choice.value}`).label) }}
              </label>
            </div>

            <!-- Sub-content: Register -->
            <div
              v-if="choice.value === type && type === DomainTypes.register"
              :class="styles.field.expanded"
            >
              <FormControl
                v-if="!open"
                form-item-id="domain-register-search"
                :auto-focus="meta.shouldAutoFocus"
              >
                <Input
                  :model-value="queryValue"
                  :placeholder="t('domain.search')"
                  :disabled="props.disabled"
                  icon-append="arrow-right"
                  @update:model-value="onRegisterInput"
                  @focus="openDrawer"
                />
              </FormControl>
              <FormMessage
                v-if="showError"
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
                v-if="showError"
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
      :loading="domainMeta.isLoading"
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
import { computed, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
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
  FormControl,
  FormMessage,
  useStyles
} from "@upmind-automation/upmind-ui";
import SmartDomainDrawer from "./components/SmartDomainDrawer.vue";
import SmartDomainExisting from "./components/SmartDomainExisting.vue";
import SmartDomainSummary from "./components/SmartDomainSummary.vue";
import config from "./smartDomainField.config";
import {
  SMART_DOMAIN_CHOICES_ORDER,
  type SmartDomainFieldProps
} from "./types";
import { debounce, map, sortBy, indexOf } from "lodash-es";
import type { SelectItemProps } from "@upmind-automation/upmind-ui";

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
  hasInfo: domainMeta.value.hasInfo
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
  required: props.required
});

// --- State
const editing = ref(false);
const open = ref(false);
const resultCount = ref(0);
const queryValue = ref(query.value || "");

// only an empty field is awaiting input — a prefilled one must not grab
// focus on mount and hijack the page's scroll
const meta = computed(() => ({ shouldAutoFocus: !queryValue.value }));

// --- Sorted and filtered choices
const sortedChoices = computed(() =>
  sortBy(choices.value, (c: DomainChoice) =>
    indexOf(SMART_DOMAIN_CHOICES_ORDER, c.value)
  )
);

// Show the field error only once touched. The form marks the field touched
// (validationMode → ValidateAndShow) when there's an outstanding error or the
// user submits — so a pristine required field stays quiet until then.
const showError = computed(() => !!(props.touched && props.errors?.length));

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
  editing.value = true;
  choose(value);
}

function onRegisterInput(value: string | number | undefined) {
  queryValue.value = value?.toString() ?? "";
}

function openDrawer() {
  open.value = true;
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
