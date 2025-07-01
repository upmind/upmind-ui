<template>
  <Button
    variant="outlined"
    color="secondary"
    :class="styles.categories.item.root"
    :aria-label="t('product.category.select', { name })"
    @click="handleClick"
  >
    <Icon
      v-if="categoryIcon"
      :icon="categoryIcon"
      size="xs"
      :class="styles.categories.item.icon"
    />

    <div :class="styles.categories.item.content">
      <h3 :class="styles.categories.item.titleContainer">
        <span :class="styles.categories.item.title">{{ name }}</span>
        <Icon
          icon="arrow-right"
          size="xs"
          :class="styles.categories.item.arrowIcon"
        />
      </h3>

      <p v-if="description" :class="styles.categories.item.description">
        {{ description }}
      </p>
    </div>
  </Button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, Button, useStyles } from "@upmind-automation/upmind-ui";

// --- config
import config from "../shop.config";
import type { ProductCategory } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

const props = defineProps<ProductCategory>();
const emit = defineEmits<{
  categorySelected: [id: string];
}>();

const { t } = useI18n();

const categoryIcon = computed(() => {
  return props.uiMeta?.uischema?.icon;
});

const handleClick = () => {
  emit("categorySelected", props.id);
};

const styles = useStyles(
  ["categories", "categories.item"],
  {},
  config
) as ComputedRef<{
  categories: {
    item: {
      root: string;
      icon: string;
      content: string;
      titleContainer: string;
      title: string;
      arrowIcon: string;
      description: string;
    };
  };
}>;
</script>
