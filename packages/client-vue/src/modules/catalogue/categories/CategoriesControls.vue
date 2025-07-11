<template>
  <div :class="styles.categories.controls.root">
    <Breadcrumb :items="items" />

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
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useClipboard } from "@vueuse/core";

// --- internal
import {
  ROUTE,
  useProductCategories,
  type ProductCategory
} from "@upmind-automation/headless";
import config from "../catalogue.config";

// --- components
import {
  Link,
  Icon,
  Breadcrumb,
  useStyles
} from "@upmind-automation/upmind-ui";

// --- types
import type { CategoriesProps } from "./types";
import type { ComputedRef } from "vue";
import { map } from "lodash-es";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<CategoriesProps, "modelValue">>();
const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { getPath } = useProductCategories();

const { copy, copied, isSupported } = useClipboard({ legacy: true });

const items = computed(() => {
  const paths = getPath(modelValue.value);

  const items = [
    // include "root" option
    {
      label: t("product.shop.title"),
      current: !modelValue.value,
      to: {
        name: ROUTE.CATALOGUE,
        query: {
          sort: props.sort,
          direction: props.direction,
          catid: undefined
        }
      }
    },
    ...map(paths, (category: ProductCategory) => ({
      label: category.title,
      current: category.id === modelValue.value,
      to: {
        name: ROUTE.CATALOGUE,
        query: {
          sort: props.sort,
          direction: props.direction,
          catid: category.id
        }
      },
      handler: () => {
        modelValue.value = category.id;
      }
    }))
  ];

  return items;
});

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
