<template>
  <RouterLink
    :aria-label="t('action.category_select', { name })"
    :class="categoriesItemRootVariants()"
    :to="{
      ...props.categoryRoute,
      query: {
        [QUERY_PARAMS.CATEGORY_ID]: id,
        sort: props.sort,
        direction: props.direction
      }
    }"
  >
    <!-- TODO: Add category icon when available from backend -->
    <!-- <Icon v-if="ui.categoryIcon.value" size="sm" :class="styles.categories.item.icon" /> -->

    <section :class="categoriesItemActionVariants()">
      <header :class="categoriesItemTitleContainerVariants()">
        <span :class="categoriesItemLinkVariants()">{{ name }}</span>
        <Badge
          v-if="categoryBadge"
          appearance="outline"
          size="sm"
          variant="neutral"
          :class="categoriesItemBadgeVariants()"
        >
          <Icon v-if="categoryBadge.icon" :icon="categoryBadge.icon" />
          {{ categoryBadge.label }}
        </Badge>
        <Icon
          icon="arrow-right"
          size="xs"
          :class="[
            categoriesItemArrowIconVariants(),
            'group-hover:text-(--text-button-link-hover)'
          ]"
        />
      </header>

      <p v-if="excerpt" :class="categoriesItemDescriptionVariants()">
        {{ excerpt }}
      </p>
    </section>
  </RouterLink>
</template>

<script setup lang="ts">
import { Badge } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { Icon } from "@upmind-automation/foundation";
import {
  type ProductCategory,
  QUERY_PARAMS
} from "@upmind-automation/headless";
import {
  categoriesItemRootVariants,
  categoriesItemActionVariants,
  categoriesItemTitleContainerVariants,
  categoriesItemLinkVariants,
  categoriesItemBadgeVariants,
  categoriesItemArrowIconVariants,
  categoriesItemDescriptionVariants
} from "../variants";
import { isString } from "lodash-es";
import type { CategoriesProps } from "./types";

defineModel<CategoriesProps["modelValue"]>("modelValue");

// -----------------------------------------------------------------------------

const props = defineProps<
  ProductCategory & Omit<CategoriesProps, "modelValue">
>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const categoryBadge = computed(() =>
  isString(props.badge) ? { label: props.badge } : props.badge
);
</script>
