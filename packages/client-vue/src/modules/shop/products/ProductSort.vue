<template>
  <div :class="styles.products.filters.root">
    <Button
      size="sm"
      variant="outline"
      color="base"
      class="w-full"
      @click="toggleDirection"
      :disabled="isEmpty(property)"
    >
      <template #prepend>
        <Icon
          :icon="
            direction == RequestSortDirection.ASC ? 'sort-asc' : 'sort-desc'
          "
          size="2xs"
          :class="styles.products.filters.trigger"
        />
      </template>
    </Button>

    <DropdownMenu :items="items" class="flex-1">
      <template #trigger>
        <Button
          size="sm"
          variant="outline"
          color="base"
          :label="currentSort?.label"
          class="w-full"
        />
      </template>
    </DropdownMenu>
  </div>
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
import config from "../shop.config";

// --- components
import {
  Button,
  Icon,
  DropdownMenu,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- utils
import { find, isEmpty } from "lodash-es";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
import type { ProductSortProps } from "./types";
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
</script>
