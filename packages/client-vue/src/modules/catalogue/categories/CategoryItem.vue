<template>
  <Button
    variant="control"
    :class="styles.categories.item.root"
    :aria-label="t('action.category_select', { name })"
    :to="{
      ...props.categoryRoute,
      query: {
        [QUERY_PARAMS.CATEGORY_ID]: id,
        sort: props.sort,
        direction: props.direction
      }
    }"
    :focusable="false"
    tabindex="-1"
  >
    <!-- TODO: Add category icon when available from backend -->
    <!-- <Icon v-if="ui.categoryIcon.value" size="sm" :class="styles.categories.item.icon" /> -->

    <section :class="styles.categories.item.action">
      <header :class="styles.categories.item.titleContainer">
        <Link
          size="lg"
          :class="styles.categories.item.link"
          :label="name"
          :to="{
            ...props.categoryRoute,
            query: {
              [QUERY_PARAMS.CATEGORY_ID]: id,
              sort: props.sort,
              direction: props.direction
            }
          }"
        />
        <Badge
          v-if="props.badge"
          v-bind="isString(props.badge) ? { label: props.badge } : props.badge"
          variant="minimal"
          size="sm"
          color="neutral"
          :class="styles.categories.item.badge"
        />
        <Icon
          icon="arrow-right"
          size="2xs"
          :class="styles.categories.item.arrowIcon"
        />
      </header>

      <p v-if="excerpt" :class="styles.categories.item.description">
        {{ excerpt }}
      </p>
    </section>
  </Button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  type ProductCategory,
  QUERY_PARAMS
} from "@upmind-automation/headless";
import {
  Icon,
  Button,
  useStyles,
  Link,
  Badge
} from "@upmind-automation/upmind-ui";
import config from "../catalogue.config";
import { isString } from "lodash-es";
import type { CategoriesProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<
  ProductCategory & Omit<CategoriesProps, "modelValue">
>();

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const meta = computed(() => {
  return {
    isSelected: modelValue.value === props.id
  };
});

const styles = useStyles(["categories", "categories.item"], meta, config);
</script>
