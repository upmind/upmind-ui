<template>
  <div class="flex flex-col gap-2">
    <span v-if="props.total > 1" class="text-muted-foreground text-sm">
      {{ t("cart.product_setup_count", { count: props.total }) }}
    </span>
    <h2 class="text-xl font-semibold">
      {{ props.title }}
    </h2>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -----------------------------------------------------------------------------

const props = defineProps<{
  total: number;
  title?: string;
}>();

const { t } = useI18n();
</script>
