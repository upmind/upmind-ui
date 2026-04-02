<template>
  <!-- Domain search -->
  <Search
    v-model="searchValue"
    :results="ownedItems"
    :placeholder="t('domain.existing.placeholder')"
    :disabled="removing || registering"
    :min-query-length="1"
    @update:search="onSearch"
    @select="onSelect"
  >
    <template #append>
      <Link v-if="isDomainLike && !validating" @click="onClear">
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
  <p v-if="unavailable" :class="styles.field.unavailable">
    {{ t("domain.existing.unavailable") }}
  </p>

  <!-- Register info section (domain is available for registration) -->
  <div v-if="registerable || registering" :class="styles.field.transfer.root">
    <p :class="styles.field.transfer.text">
      {{ t("domain.existing.register_info", { price: registerPrice ?? "" }) }}
    </p>

    <Button
      variant="outline"
      size="lg"
      icon="shopping-cart-01"
      :label="t('domain.existing.add_registration')"
      :disabled="registering"
      :loading="registering"
      @click="emit('addRegistration')"
    />
  </div>

  <!-- DNS info (no transfer or registration available) -->
  <p v-if="dnsOnly" :class="styles.field.transfer.text">
    {{ t("domain.existing.dns_info") }}
  </p>

  <!-- Transfer info section (checked or transferred) -->
  <div
    v-if="checked || transferred || transferring || removing"
    :class="styles.field.transfer.root"
  >
    <p :class="styles.field.transfer.text">
      {{ t("domain.existing.transfer_info", { price: transferPrice ?? "" }) }}
    </p>

    <Button
      v-if="!transferred && !removing"
      variant="outline"
      size="lg"
      icon="refresh-cw-05"
      :label="t('domain.existing.add_transfer')"
      :disabled="transferring"
      :loading="transferring"
      @click="emit('addTransfer')"
    />

    <Button
      v-if="transferred || removing"
      variant="solid"
      size="lg"
      icon="check-circle-broken"
      :label="t('domain.existing.remove_transfer')"
      :disabled="removing"
      :loading="removing"
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
  useStyles
} from "@upmind-automation/upmind-ui";
import { DEBOUNCE_DELAY } from "@upmind-automation/headless";
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
const styles = useStyles(["field.transfer", "field.unavailable"], {}, config);

const searchValue = ref(props.modelValue ?? "");

const ownedItems = computed((): SearchItem[] | null => {
  if (!props.filteredOwned) return null;
  return map(props.filteredOwned, item => ({
    id: item.domain?.toString() ?? "",
    label: item.domain?.toString() ?? ""
  }));
});

const debouncedEmit = debounce(
  (value: string) => emit("update:modelValue", value),
  DEBOUNCE_DELAY
);

function onSearch(value: string | number) {
  const str = value.toString();

  if (!str) {
    debouncedEmit.cancel();
    return;
  }

  debouncedEmit(str);
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
