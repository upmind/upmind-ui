<template>
  <!-- Domain search -->
  <Search
    v-model="searchValue"
    :results="filteredOwned"
    :placeholder="t('domain.existing.placeholder')"
    :disabled="removing"
    :min-query-length="1"
    @update:search="onSearch"
    @select="onSelect"
  >
    <template #append>
      <Link v-if="showClearButton" @click="onClear">
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

  <!-- Transfer info section (checked or transferred) -->
  <div v-if="checked || transferred" :class="styles.field.transfer.root">
    <p :class="styles.field.transfer.text">
      {{ transferInfoText }}
    </p>

    <Button
      v-if="!transferred"
      variant="outline"
      size="lg"
      icon="refresh-cw-05"
      :label="t('domain.existing.add_transfer')"
      :disabled="transferring"
      :loading="transferring"
      @click="emit('addTransfer')"
    />

    <Button
      v-if="transferred"
      variant="secondary"
      size="lg"
      icon-prepend="check-circle-broken"
      :label="t('domain.existing.add_transfer')"
      :disabled="removing"
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
import { filter, includes, map, debounce } from "lodash-es";
import config from "../smartDomainField.config";
import type { SearchItem } from "@upmind-automation/upmind-ui";
import type { SmartDomainExistingProps } from "../types";
import { DEBOUNCE_DELAY } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const props = defineProps<SmartDomainExistingProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "addTransfer"): void;
  (e: "removeTransfer"): void;
}>();

const { t } = useI18n();
const styles = useStyles(["field.transfer", "field.unavailable"], {}, config);

// --- Local search value (synced via v-model on Search)

const searchValue = ref(props.modelValue ?? "");

// --- Owned domains mapped for Search

const ownedItems = computed((): SearchItem[] =>
  map(props.owned ?? [], item => ({
    id: item.domain?.toString() ?? "",
    label: item.domain?.toString() ?? ""
  }))
);

// --- Filtered results (updated on each search)

const filteredOwned = ref<SearchItem[] | null>(null);

// --- Debounced emit to parent

const debouncedEmit = debounce(
  (value: string) => emit("update:modelValue", value),
  DEBOUNCE_DELAY
);

// --- Search handler: filters owned domains AND emits typed value to parent

function onSearch(value: string | number) {
  const str = value.toString();

  if (!str) {
    debouncedEmit.cancel();
    filteredOwned.value = null;
    return;
  }

  debouncedEmit(str);

  const matches = filter(ownedItems.value, item =>
    includes(item.label.toLowerCase(), str.toLowerCase())
  );
  filteredOwned.value = matches.length ? matches : null;
}

// --- Selection handler (item picked from dropdown)

function onSelect(item: SearchItem): void {
  if (item.id) {
    debouncedEmit.cancel();
    emit("update:modelValue", item.label);
    filteredOwned.value = null;
  }
}

// --- Clear handler

function onClear(): void {
  searchValue.value = "";
  filteredOwned.value = null;
  emit("update:modelValue", "");
}

// --- Clear button visibility

const showClearButton = computed(() => {
  return props.checked || props.transferred || props.unavailable;
});

// --- Transfer info text

const transferInfoText = computed(() => {
  const price = props.transferPrice ?? "";
  return t("domain.existing.transfer_info", { price });
});
</script>
