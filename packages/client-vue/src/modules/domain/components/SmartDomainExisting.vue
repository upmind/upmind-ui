<template>
  <!-- Domain autocomplete -->
  <Autocomplete
    :model-value="modelValue ?? undefined"
    :items="ownedItems"
    :placeholder="t('domain.existing.placeholder')"
    :disabled="removing"
    :search="doSearch"
    width="full"
    @update:model-value="onSelect"
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
  </Autocomplete>

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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Autocomplete,
  Button,
  Icon,
  Link,
  useStyles
} from "@upmind-automation/upmind-ui";
import { filter, includes, map } from "lodash-es";
import config from "../smartDomainField.config";
import type { AutocompleteItemProps } from "@upmind-automation/upmind-ui";
import type { SmartDomainExistingProps } from "../types";
// -----------------------------------------------------------------------------

const props = defineProps<SmartDomainExistingProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "addTransfer"): void;
  (e: "removeTransfer"): void;
}>();

const { t } = useI18n();
const styles = useStyles(["field.transfer", "field.unavailable"], {}, config);

// --- Owned domains mapped for Autocomplete

const ownedItems = computed((): AutocompleteItemProps[] =>
  map(props.owned ?? [], item => ({
    label: item.domain?.toString() ?? "",
    value: item.domain?.toString() ?? ""
  }))
);

// --- Search function: filters owned domains AND emits typed value to parent

async function doSearch(value: string): Promise<AutocompleteItemProps[]> {
  emit("update:modelValue", value);

  return filter(ownedItems.value, item =>
    includes(item.value.toLowerCase(), value.toLowerCase())
  );
}

// --- Selection handler (item picked from dropdown)

function onSelect(
  value: string | number | boolean | Record<string, any>
): void {
  if (value) {
    emit("update:modelValue", value.toString());
  }
}

// --- Clear handler

function onClear(): void {
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
