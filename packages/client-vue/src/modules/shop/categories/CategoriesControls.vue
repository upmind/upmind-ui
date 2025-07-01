<template>
  <div :class="styles.categories.controls.root">
    <Breadcrumb :items="breadcrumbItems" />

    <div v-if="isSupported" :class="styles.categories.controls.shareContainer">
      <Icon
        :icon="copied ? 'check' : 'share'"
        size="xs"
        :class="styles.categories.controls.shareIcon"
      />
      <Link @click="handleShare">
        {{ copied ? t("product.shop.copied") : t("product.shop.share") }}
      </Link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useClipboard } from "@vueuse/core";
import {
  useProductCategories,
  type ProductCategory
} from "@upmind-automation/headless";
import {
  Link,
  Icon,
  Breadcrumb,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- config
import config from "../shop.config";
import type { ControlsProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<ControlsProps>();
const emit = defineEmits<{
  navigate: [categoryId?: string];
}>();

const { t } = useI18n();

const { data } = useProductCategories();

const { copy, copied, isSupported } = useClipboard({ legacy: true });

const categoryPath = computed(() => {
  if (!props.categoryId || !data.value) return [];
  return findCategoryPath(props.categoryId);
});

const breadcrumbItems = computed(() => {
  const items = [
    {
      label: t("product.shop.title"),
      current: !props.categoryId,
      href: "/shop",
      onClick: (event?: Event) => {
        event?.preventDefault();
        handleNavigation(undefined);
      }
    }
  ];

  categoryPath.value.forEach((category: ProductCategory, index: number) => {
    items.push({
      label: category.title,
      current: index === categoryPath.value.length - 1,
      href: `/shop/${category.id}`,
      onClick: (event?: Event) => {
        event?.preventDefault();
        handleNavigation(category.id);
      }
    });
  });

  return items;
});

const findCategoryPath = (
  targetId: string,
  categories: ProductCategory[] = data.value || [],
  path: ProductCategory[] = []
): ProductCategory[] => {
  for (const category of categories) {
    const currentPath = [...path, category];

    if (category.id === targetId) {
      return currentPath;
    }

    if (category.categories?.length) {
      const found = findCategoryPath(
        targetId,
        category.categories,
        currentPath
      );
      if (found.length) {
        return found;
      }
    }
  }
  return [];
};

const handleNavigation = (categoryId?: string) => {
  emit("navigate", categoryId);
};

const handleShare = () => {
  copy(window.location.href);
};

const styles = useStyles(
  ["categories", "categories.controls"],
  {},
  config
) as ComputedRef<{
  categories: {
    controls: {
      root: string;
      shareContainer: string;
      shareIcon: string;
    };
  };
}>;
</script>
