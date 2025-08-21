<template>
  <ButtonGroup
    :items="groupItems"
    variant="outline"
    color="base"
    size="lg"
    :class="styles.products.filters.root"
  />
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
import config from "../../catalogue.config";

// --- components
import {
  ButtonGroup,
  ButtonGroupTypes,
  useStyles,
  type ButtonGroupItem,
  type ButtonProps,
  type DropdownMenuProps
} from "@upmind-automation/upmind-ui";

// --- utils
import { find, isEmpty } from "lodash-es";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
import type { ProductSortProps } from "../types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const property = defineModel<ProductSortProps["property"]>("property", {
  default: ProductSortableProperties.DEFAULT
});

const direction = defineModel<ProductSortProps["direction"]>("direction", {
  default: RequestSortDirection.ASC
});
// -----------------------------------------------------------------------------

const { t } = useI18n();

const currentSort = computed(() => {
  return find(items.value, { value: property.value });
});

function toggleDirection() {
  direction.value =
    direction.value == RequestSortDirection.ASC
      ? RequestSortDirection.DESC
      : RequestSortDirection.ASC;
}
const items = computed((): DropdownMenuItemProps[] => [
  {
    label: t("product.sort.default"),
    value: ProductSortableProperties.DEFAULT,
    handler: () => {
      property.value = ProductSortableProperties.DEFAULT;
    }
  },
  {
    label: t("product.sort.name"),
    value: ProductSortableProperties.NAME,
    handler: () => {
      property.value = ProductSortableProperties.NAME;
    }
  },
  {
    label: t("product.sort.price"),
    value: ProductSortableProperties.PRICE,
    handler: () => {
      property.value = ProductSortableProperties.PRICE;
    }
  }
]);

const styles = useStyles(
  ["products", "products.filters"],
  {},
  config
) as ComputedRef<{
  products: {
    filters: {
      root: string;
      trigger: string;
    };
  };
}>;

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
    type: ButtonGroupTypes.Dropdown,
    props: {
      label: currentSort.value?.label,
      items: items.value
    } satisfies DropdownMenuProps
  }
]);
</script>
