<template>
  <ButtonGroup :items="groupItems" variant="outline" class="w-full" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  ProductSortableProperties,
  RequestSortDirection
} from "@upmind-automation/headless";
import {
  ButtonGroup,
  ButtonGroupTypes,
  type ButtonGroupItem,
  type ButtonProps,
  type SelectProps
} from "@upmind-automation/upmind-ui";
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

const groupItems = computed((): ButtonGroupItem[] => [
  {
    type: ButtonGroupTypes.Button,
    props: {
      icon:
        direction.value == RequestSortDirection.ASC ? "arrow-down" : "arrow-up",
      disabled: isEmpty(property.value)
    } satisfies ButtonProps,
    handler: toggleDirection
  },
  {
    type: ButtonGroupTypes.Select,
    class: "w-full",
    props: {
      modelValue: property.value,
      items: items.value,
      placeholder: currentSort.value?.label,
      width: "full"
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
