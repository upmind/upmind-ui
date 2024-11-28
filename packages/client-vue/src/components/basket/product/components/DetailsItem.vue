<template>
  <div class="flex justify-between">
    <!-- Padding and minues margin avoids text from being cut off from overflow and keeps position -->
    <p class="-my-1 truncate py-1">
      {{ name }}

      <template v-if="quantity && quantity > 1">
        ({{ t("product.configurationQuantity") }}{{ quantity }})
      </template>
    </p>

    <div v-if="currentPrice" class="flex items-center gap-x-1">
      <template v-if="pricingKey !== 'term'">
        <span v-if="showPlusIcon">
          <Icon icon="plus" size="4xs" class="mr-1" />
        </span>
        <span v-else-if="overrides">
          <Tooltip
            :label="t('product.overridden')"
            color="primary"
            class="max-w-64 text-center"
          >
            <Icon size="3xs" icon="random" class="mr-1" />
          </Tooltip>
        </span>
      </template>

      <template v-if="!free">
        {{ currentPrice }}
        <template v-if="showTermLabel">
          {{ t(`product.terms.term.${cycle}`) }}
        </template>
      </template>

      <template v-else>
        <span>{{ t("product.free") }}</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, Tooltip } from "@upmind-automation/upwind";

// --- types
interface Props {
  id: string;
  name: string;
  quantity?: number;
  currentPrice?: string;
  currentAmount?: number;
  overrides?: boolean;
  cycle?: number;
  pricingKey?: string;
  free?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const showPlusIcon = computed(
  () => !props.overrides && props.currentAmount && props.currentAmount > 0
);
const showTermLabel = computed(
  () => props.currentAmount && props.currentAmount > 0
);
</script>
