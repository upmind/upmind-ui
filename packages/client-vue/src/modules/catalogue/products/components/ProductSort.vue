<template>
  <ButtonGroup :items="groupItems" variant="outline" size="lg" />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";

// --- components
import {
  ButtonGroup,
  ButtonGroupTypes,
  type ButtonGroupItem,
  type ButtonProps,
  type SelectProps
} from "@upmind-automation/upmind-ui";

// --- utils
import { find, isEmpty } from "lodash-es";

// --- types
import type { SelectItemProps } from "@upmind-automation/upmind-ui";
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
    label: t("product.sort.default"),
    value: ProductSortableProperties.DEFAULT
  },
  {
    label: t("product.sort.name"),
    value: ProductSortableProperties.NAME
  },
  {
    label: t("product.sort.price"),
    value: ProductSortableProperties.PRICE
  }
]);

const groupItems = computed((): ButtonGroupItem[] => [
  {
    type: ButtonGroupTypes.Button,
    props: {
      icon:
        direction.value == RequestSortDirection.ASC ? "sort-asc" : "sort-desc",
      disabled: isEmpty(property.value)
    } satisfies ButtonProps,
    handler: toggleDirection
  },
  {
    type: ButtonGroupTypes.Select,
    props: {
      modelValue: property.value,
      items: items.value,
      placeholder: currentSort.value?.label
    } satisfies SelectProps,
    handler: (value: string) => {
      property.value = value as ProductSortableProperties;
    }
  }
]);

const currentSort = computed(() => {
  return find(items.value, { value: property.value });
});

function toggleDirection() {
  direction.value =
    direction.value == RequestSortDirection.ASC
      ? RequestSortDirection.DESC
      : RequestSortDirection.ASC;
}
</script>
