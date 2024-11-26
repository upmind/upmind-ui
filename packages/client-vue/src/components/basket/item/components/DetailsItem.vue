<template>
  <div class="flex flex-col gap-y-2">
    <div class="opacity-35">
      <span v-if="isTerm">{{ product.category }}</span>
      <span v-else>{{ item.category }}</span>
    </div>

    <div class="flex justify-between">
      <div>
        <template v-if="isValid">
          <span v-if="isTerm">{{ product.name }}</span>
          <span v-else>{{ item.name }}</span>

          <span v-if="item.quantity && item.quantity > 1">
            (x{{ item.quantity }})</span
          >
        </template>
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
        <span v-if="!isTerm && !item.meta?.overrides">+ </span>
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
import type {
  BasketProductSummaryDetail,
  BasketProductDetails,
} from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  item: BasketProductSummaryDetail;
  product: BasketProductDetails;
}>();

const { t } = useI18n();

const isTerm = computed(() => props.item.key === "term");
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
