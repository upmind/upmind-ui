<template>
  <div class="flex justify-between">
    <!-- Padding and minues margin avoids text from being cut off from overflow and keeps position -->
    <p class="-my-1 py-1 leading-4">
      {{ name }}

      <template v-if="quantity && quantity > 1">
        ({{ t("product.configurationQuantity") }}{{ quantity }})
      </template>
    </p>

    <span v-if="currentPrice" class="flex items-center gap-x-1">
      <template v-if="pricingKey !== 'term'">
        <span v-if="showPlusIcon">
          <Icon icon="plus" size="4xs" class="-mt-[2px] mr-0.5" />
        </span>
        <span v-else-if="overrides">
          <Tooltip
            :label="t('product.overridden')"
            class="max-w-64 text-center"
          >
            <Icon size="3xs" icon="random" class="mr-0.5" />
          </Tooltip>
        </span>
      </template>

      <p v-if="!free" class="m-0 whitespace-nowrap">
        {{ currentPrice }}
        <template v-if="showTermLabel">
          {{ t(`product.terms.term.${cycle}`) }}
        </template>
      </p>

      <template v-else>
        <span>{{ t("product.free") }}</span>
      </template>
    </span>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, Tooltip } from "@upmind-automation/upmind-ui";

const props = defineProps<{
  id: string;
  name: string;
  quantity?: number;
  currentPrice?: string;
  currentAmount?: number;
  overrides?: boolean;
  cycle?: number;
  pricingKey?: string;
  free?: boolean;
}>();

const { t } = useI18n();

const showPlusIcon = computed(
  () => !props.overrides && props.currentAmount && props.currentAmount > 0
);
const showTermLabel = computed(
  () => props.currentAmount && props.currentAmount > 0
);
</script>
