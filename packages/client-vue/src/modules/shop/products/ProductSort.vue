<template>
  <div :class="styles.products.filters.root">
    <DropdownMenu :items="items" width="full" class="md:w-auto">
      <template #trigger>
        <Button
          size="sm"
          variant="outline"
          color="base"
          :label="currentFilter?.label"
          class="w-full"
        >
          <template #prepend>
            <Icon
              :icon="currentFilter?.icon ?? 'sort'"
              size="2xs"
              :class="styles.products.filters.trigger"
            />
          </template>
        </Button>
      </template>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import {
  Button,
  Icon,
  DropdownMenu,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- config
import config from "../shop.config";

// --- types
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
import { ProductSortType, type ProductSortProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<ProductSortProps>(), {
  modelValue: ProductSortType.DEFAULT
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n();

const currentFilter = computed(() => {
  return items.value.find(item => item.value === props.modelValue);
});

const handleFilterSelect = (value: string) => {
  emit("update:modelValue", value);
};

const items = computed((): DropdownMenuItemProps[] => [
  {
    label: t("product.sort.default"),
    value: ProductSortType.DEFAULT,
    icon: "sort",
    handler: () => handleFilterSelect(ProductSortType.DEFAULT)
  },
  {
    label: t("product.sort.name"),
    value: ProductSortType.NAME,
    icon: "sort-letters",
    handler: () => handleFilterSelect(ProductSortType.NAME)
  },
  {
    label: t("product.sort.price"),
    value: ProductSortType.PRICE,
    icon: "sort-numbers",
    handler: () => handleFilterSelect(ProductSortType.PRICE)
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
