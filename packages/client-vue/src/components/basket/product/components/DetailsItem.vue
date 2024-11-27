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
      <div v-if="currentPrice" class="flex items-center gap-x-1">
        <span v-if="!overrides && currentAmount && currentAmount > 0"
          ><Icon icon="plus" size="4xs" class="-mt-[2px] mr-1"
        /></span>
        <span v-else-if="overrides"
          ><Tooltip :label="t('product.overridden')" color="primary">
            <Icon size="3xs" icon="random" class="mr-1"
          /></Tooltip>
        </span>
        <span>{{ currentPrice }}</span>
        <span v-if="currentAmount && currentAmount > 0">{{
          t(`product.terms.term.${cycle}`)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Button, Icon, Tooltip } from "@upmind-automation/upwind";

const props = defineProps<{
  id: string;
  category: string;
  name: string;
  quantity?: number;
  currentPrice?: string;
  currentAmount?: number;
  overrides?: boolean;
  invalid?: boolean;
  cycle?: number;
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
