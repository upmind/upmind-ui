<template>
  <div
    class="inline-flex w-full"
    role="group"
    :aria-label="t('action.sort_products')"
  >
    <Button
      variant="control"
      size="lg"
      :disabled="isEmpty(property)"
      class="shadow-field hover:bg-surface hover:text-muted rounded-r-none"
      @click="toggleDirection"
    >
      <Icon :icon="directionIcon" />
    </Button>

    <Select
      :model-value="property"
      :items="items"
      :placeholder="currentSort?.label"
      size="lg"
      class="w-full rounded-l-none border-l-0"
      @update:model-value="onSort"
    />
  </div>
</template>

<script setup lang="ts">
import { Button, Select } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import { Icon } from "../../../../components/icon";
import { find, isEmpty } from "lodash-es";
import type { ProductSortProps } from "../types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const property = defineModel<ProductSortProps["property"]>("property", {
  default: ProductSortableProperties.DEFAULT
});

const direction = defineModel<ProductSortProps["direction"]>("direction", {
  default: RequestSortDirection.ASC
});

const items = computed(() => [
  {
    label: t("action.sort_by_default"),
    value: ProductSortableProperties.DEFAULT
  },
  {
    label: t("action.sort_by_name"),
    value: ProductSortableProperties.NAME
  },
  {
    label: t("action.sort_by_price"),
    value: ProductSortableProperties.PRICE
  }
]);

const currentSort = computed(() =>
  find(items.value, { value: property.value })
);

const directionIcon = computed(() => {
  if (direction.value === RequestSortDirection.ASC) return "arrow-down";
  return "arrow-up";
});

// Narrow the Select's wide emit back onto the typed property model.
function onSort(value: unknown) {
  const match = items.value.find(item => item.value === value);
  if (match) property.value = match.value;
}

function toggleDirection() {
  if (direction.value === RequestSortDirection.ASC) {
    direction.value = RequestSortDirection.DESC;
  } else {
    direction.value = RequestSortDirection.ASC;
  }
}
</script>
