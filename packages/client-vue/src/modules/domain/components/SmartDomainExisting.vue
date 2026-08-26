<template>
  <!-- Domain search -->
  <Search
    v-model="searchValue"
    :auto-focus="meta.shouldAutoFocus"
    :results="ownedItems"
    :placeholder="t('domain.existing.placeholder')"
    :disabled="disabled || removing || registering"
    :min-query-length="1"
    @update:search="onSearch"
    @select="onSelect"
  >
    <template #append>
      <Link v-if="isDomainLike && !validating && !disabled" @click="onClear">
        <Icon icon="x-close" class="size-5" />
      </Link>
      <Icon
        v-else-if="validating"
        icon="loading-01"
        class="size-5 animate-spin"
      />
      <Icon v-else icon="arrow-right" class="size-5" />
    </template>
  </Search>

  <!-- Unavailable message -->
  <FormMessage
    v-if="unavailable"
    form-message-id="domain-existing-unavailable"
    name="domain"
    :errors="t('domain.existing.unavailable')"
  />

  <!-- Register info section (domain is available for registration) -->
  <div v-if="registerable || registering" :class="fieldTransferRootVariants()">
    <p :class="fieldTransferTextVariants()">
      {{
        t(
          meta.isFreeRegistration
            ? "domain.existing.register_info_free"
            : "domain.existing.register_info",
          {
            price: registerPrice ?? "",
            period: parseBillingCycle(props.cycle ?? 0).numeric
          }
        )
      }}
    </p>

    <Button
      variant="outline"
      size="lg"
      :disabled="disabled || registering"
      :loading="registering"
      :block="isMobile"
      :data-attrs="{ 'data-test-key': 'domain-add-registration-button' }"
      @click="emit('addRegistration')"
    >
      <Icon icon="shopping-cart-01" />
      {{ t("domain.existing.add_registration") }}
    </Button>
  </div>

  <!-- DNS info (no transfer or registration available) -->
  <p v-if="dnsOnly" :class="fieldTransferTextVariants()">
    {{ t("domain.existing.dns_info") }}
  </p>

  <!-- Transfer info section (checked or transferred) -->
  <!--
    Two i18n variants:
      - `transfer_info_free` — the transfer costs nothing (brand price
        override of 0, or a zero price). Drives off `meta.isFreeTransfer`
        rather than string-matching the formatted label so any locale's
        "FREE" translation works without code changes.
      - `transfer_info` — paid transfer. `transferPrice` is the value
        rendered for the transfer cost; we prefer the brand override
        (`transferOptionPrice`) and fall back to the parent product's
        annual price. The renewal line always uses the parent product's
        price (`props.transferPrice`) since the brand override only
        applies to the one-off transfer fee.
  -->
  <div
    v-if="checked || transferred || transferring || removing"
    :class="fieldTransferRootVariants()"
  >
    <p
      :class="fieldTransferTextVariants()"
      v-bind="transferPricingTestAttrs(transferOptionIsFree ? 'free' : 'paid')"
    >
      {{
        t(
          meta.isFreeTransfer
            ? "domain.existing.transfer_info_free"
            : "domain.existing.transfer_info",
          {
            transferPrice: transferOptionPrice ?? transferPrice ?? "",
            renewalPrice: renewalPrice ?? transferPrice ?? "",
            term: parseBillingCycle(props.cycle ?? 0).suffix
          }
        )
      }}
    </p>

    <Button
      v-if="!transferred && !removing"
      variant="outline"
      size="lg"
      :disabled="disabled || transferring"
      :loading="transferring"
      :block="isMobile"
      :data-attrs="{ 'data-test-key': 'domain-add-transfer-button' }"
      @click="emit('addTransfer')"
    >
      <Icon icon="plus-circle" />
      {{ t("domain.existing.add_transfer") }}
    </Button>

    <Button
      v-if="transferred || removing"
      variant="primary"
      size="lg"
      :disabled="disabled || removing"
      :loading="removing"
      :block="isMobile"
      @click="emit('removeTransfer')"
    >
      <Icon icon="check-circle-broken" />
      {{ t("domain.existing.transfer_added") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useTestAttrs } from "@upmind/ui";
import { Search } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  DEBOUNCE_DELAY,
  parseBillingCycle,
  useConfig,
  useMoney
} from "@upmind-automation/headless";
import { FormMessage } from "../../../components/form";
import { Icon } from "../../../components/icon";
import { isMobile } from "../../../composables/isMobile";
import {
  fieldTransferRootVariants,
  fieldTransferTextVariants
} from "../smartDomainField.variants";
import { map, debounce } from "lodash-es";
import type { SmartDomainExistingProps } from "../types";
import type { SearchItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

const props = defineProps<SmartDomainExistingProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "addTransfer"): void;
  (e: "removeTransfer"): void;
  (e: "addRegistration"): void;
}>();

const { t } = useI18n();
const { ui } = useConfig();
const { isFree } = useMoney();

const transferPricingTestAttrs = (value: string) =>
  useTestAttrs({ key: "domain-transfer-pricing-info", value });

const searchValue = ref(props.modelValue ?? "");

// only an unresolved empty field is awaiting input — a prefilled or
// transfer-satisfied one (the input is empty; the domain lives in the
// transfer section) must not grab focus on mount and hijack the scroll
const meta = computed(() => ({
  shouldAutoFocus:
    !props.transferred && !props.modelValue && !searchValue.value,
  // a zero price only reads as "FREE" when the brand renders it as a label
  isFreeTransfer:
    !!props.transferOptionIsFree ||
    (ui.zeroPriceDisplay.isLabel && isFree(props.transferPrice)),
  isFreeRegistration: ui.zeroPriceDisplay.isLabel && isFree(props.registerPrice)
}));

const ownedItems = computed((): SearchItem[] | null => {
  if (!props.filteredOwned) return null;
  return map(props.filteredOwned, item => ({
    id: item.domain,
    label: item.domain
  }));
});

const debouncedEmit = debounce(
  (value: string) => emit("update:modelValue", value),
  DEBOUNCE_DELAY
);

function onSearch(value: string | number) {
  if (!value) {
    debouncedEmit.cancel();
    emit("update:modelValue", "");
    return;
  }
  debouncedEmit(value.toString());
}

function onSelect(item: SearchItem): void {
  if (item.id) {
    debouncedEmit.cancel();
    emit("update:modelValue", item.label);
  }
}

function onClear(): void {
  searchValue.value = "";
  emit("update:modelValue", "");
}
</script>
