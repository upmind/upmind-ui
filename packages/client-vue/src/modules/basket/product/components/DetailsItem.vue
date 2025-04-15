<template>
  <div class="flex justify-between">
    <!-- Padding and minues margin avoids text from being cut off from overflow and keeps position -->
    <p class="-my-1 py-1 leading-4">
      {{ title }}

      <template v-if="quantity && quantity > 1">
        ({{ t("product.configurationQuantity") }}{{ quantity }})
      </template>
    </p>

    <span v-if="hasPricing" class="flex items-center gap-x-1">
      <template v-if="props.name !== 'term'">
        <span v-if="showPlusIcon">
          <Icon icon="plus" size="4xs" class="-mt-[2px] mr-0.5" />
        </span>
        <span v-else-if="props.meta?.overrides">
          <Tooltip
            :label="t('product.overridden')"
            class="max-w-64 text-center"
          >
            <Icon size="3xs" icon="random" class="mr-0.5" />
          </Tooltip>
        </span>
      </template>

      <p v-if="!props.meta?.free" class="m-0 whitespace-nowrap">
        {{ safePrice }}

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

// --- components
import { Icon, Tooltip } from "@upmind-automation/upmind-ui";

// --- types
import type {
  ProductSummaryDetailWithPrice,
  ProductSummaryDetail,
} from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------

const props = defineProps<
  ProductSummaryDetail | ProductSummaryDetailWithPrice
>();

const { t } = useI18n();

const showPlusIcon = computed(
  () =>
    !props.meta?.overrides &&
    "price" in props &&
    props?.price?.currentAmount > 0
);
const showTermLabel = computed(() => props?.cycle && props.cycle > 0);

const hasPricing = computed(() => "currentAmount" in props);

const safePrice = computed(() => {
  return "price" in props ? props.price.currentPrice : "";
});
</script>
