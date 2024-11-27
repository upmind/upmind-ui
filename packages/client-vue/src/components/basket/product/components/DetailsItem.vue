<template>
  <div class="flex flex-col gap-y-2">
    <div class="truncate opacity-35">
      {{ item.category }}
    </div>

    <div class="flex justify-between">
      <div>
        <span v-if="isValid" class="truncate">
          {{ item.name }}

          <template v-if="item.quantity && item.quantity > 1">
            ({{ t("product.configurationQuantity") }}{{ item.quantity }})
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
      <div v-if="item.currentPrice">
        <span v-if="!item.meta?.overrides">+ </span>
        <span>{{ item.currentPrice }}</span>
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

// --- types
import type { BasketProductSummaryDetail } from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  item: BasketProductSummaryDetail;
}>();

const { t } = useI18n();

// TODO: Sometimes contains an empty invalid array when invalid
const isValid = computed(() => !("invalid" in (props.item.meta ?? {})));

const editLink = computed(() => {
  return {
    name: "productEdit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
