<template>
  <Button variant="control" as-child :class="categoriesItemRootVariants()">
    <RouterLink
      :aria-label="t('action.category_select', { name })"
      :to="{
        ...props.categoryRoute,
        query: {
          [QUERY_PARAMS.CATEGORY_ID]: id,
          sort: props.sort,
          direction: props.direction
        }
      }"
      tabindex="-1"
    >
      <!-- TODO: Add category icon when available from backend -->
      <!-- <Icon v-if="ui.categoryIcon.value" size="sm" :class="styles.categories.item.icon" /> -->

      <section :class="categoriesItemActionVariants()">
        <header :class="categoriesItemTitleContainerVariants()">
          <Link
            size="md"
            :class="[
              categoriesItemLinkVariants(),
              'underline transition-colors duration-200',
              'group-hover:text-(--text-button-link-hover) group-hover:[text-decoration-color:var(--text-button-link-hover)]'
            ]"
            :to="{
              ...props.categoryRoute,
              query: {
                [QUERY_PARAMS.CATEGORY_ID]: id,
                sort: props.sort,
                direction: props.direction
              }
            }"
            >{{ name }}</Link
          >
          <Badge
            v-if="categoryBadge"
            appearance="outline"
            size="sm"
            variant="neutral"
            :class="categoriesItemBadgeVariants()"
          >
            <Icon
              v-if="categoryBadge.icon"
              :icon="categoryBadge.icon"
              size="xs"
            />
            {{ categoryBadge.label }}
          </Badge>
          <Icon
            icon="arrow-right"
            size="sm"
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
  </Button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import {
  type ProductCategory,
  QUERY_PARAMS
} from "@upmind-automation/headless";
import { Link } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Badge } from "@upmind/ui";
import { Icon } from "../../../components/icon";
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

// -----------------------------------------------------------------------------

const props = defineProps<
  ProductCategory & Omit<CategoriesProps, "modelValue">
>();

defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const categoryBadge = computed(() =>
  isString(props.badge) ? { label: props.badge } : props.badge
);
</script>
