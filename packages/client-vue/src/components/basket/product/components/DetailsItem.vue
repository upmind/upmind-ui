<template>
  <div class="flex flex-col gap-y-2 py-3 first:pt-0 last:pb-0">
    <div class="truncate opacity-35">
      {{ category }}
    </div>

    <div class="flex justify-between">
      <div>
        <span v-if="!invalid" class="truncate">
          {{ name }}

          <template v-if="quantity && quantity > 1">
            ({{ t("product.configurationQuantity") }}{{ quantity }})
          </template>
        </span>
        <template v-else>
          <router-link :to="editLink">
            <Button
              variant="link"
              size="sm"
              :label="t('product.configureNow')"
              color="error"
              class="inline-block h-5 underline"
            />
          </router-link>
        </template>
      </div>
      <div v-if="currentPrice">
        <span v-if="overrides">+ </span>
        <span>{{ currentPrice }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Button } from "@upmind-automation/upwind";

const props = defineProps<{
  id: string;
  category: string;
  name: string;
  quantity?: number;
  currentPrice?: string;
  overrides?: boolean;
  invalid?: boolean;
}>();

const { t } = useI18n();

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
