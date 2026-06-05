<template>
  <!-- Domain search -->
  <Search
    v-model="searchValue"
    auto-focus
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
  <div v-if="registerable || registering" :class="styles.field.transfer.root">
    <p :class="styles.field.transfer.text">
      {{
        t("domain.existing.register_info", {
          price: registerPrice ?? "",
          period: parseBillingCycle(props.cycle ?? 0).numeric
        })
      }}
    </p>

    <Button
      variant="outline"
      size="lg"
      icon="shopping-cart-01"
      :label="t('domain.existing.add_registration')"
      :disabled="disabled || registering"
      :loading="registering"
      :block="isMobile"
      @click="emit('addRegistration')"
    />
  </div>

  <!-- DNS info (no transfer or registration available) -->
  <p v-if="dnsOnly" :class="styles.field.transfer.text">
    {{ t("domain.existing.dns_info") }}
  </p>

  <!-- Transfer info section (checked or transferred) -->
  <!--
    Two i18n variants:
      - `transfer_info_free` — brand has configured a price override of 0
        (e.g. ".com transfer for free"). Drives off `transferOptionIsFree`
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
    :class="styles.field.transfer.root"
  >
    <p :class="styles.field.transfer.text">
      {{
        transferOptionIsFree
          ? t("domain.existing.transfer_info_free", {
              renewalPrice: renewalPrice ?? transferPrice ?? "",
              term: parseBillingCycle(props.cycle ?? 0).suffix
            })
          : t("domain.existing.transfer_info", {
              transferPrice: transferOptionPrice ?? transferPrice ?? "",
              renewalPrice: renewalPrice ?? transferPrice ?? "",
              term: parseBillingCycle(props.cycle ?? 0).suffix
            })
      }}
    </p>

    <Button
      v-if="!transferred && !removing"
      variant="outline"
      size="lg"
      icon="plus-circle"
      :label="t('domain.existing.add_transfer')"
      :disabled="disabled || transferring"
      :loading="transferring"
      :block="isMobile"
      @click="emit('addTransfer')"
    />

    <Button
      v-if="transferred || removing"
      variant="solid"
      size="lg"
      icon="check-circle-broken"
      :label="t('domain.existing.transfer_added')"
      :disabled="disabled || removing"
      :loading="removing"
      :block="isMobile"
      @click="emit('removeTransfer')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  Search,
  Button,
  Icon,
  Link,
  FormMessage,
  useStyles,
  isMobile
} from "@upmind-automation/upmind-ui";
import { DEBOUNCE_DELAY, parseBillingCycle } from "@upmind-automation/headless";
import { map, debounce } from "lodash-es";
import config from "../smartDomainField.config";
import type { SearchItem } from "@upmind-automation/upmind-ui";
import type { SmartDomainExistingProps } from "../types";
// -----------------------------------------------------------------------------

const props = defineProps<SmartDomainExistingProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "addTransfer"): void;
  (e: "removeTransfer"): void;
  (e: "addRegistration"): void;
}>();

const { t } = useI18n();
const styles = useStyles(["field.transfer"], {}, config);

const searchValue = ref(props.modelValue ?? "");

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
