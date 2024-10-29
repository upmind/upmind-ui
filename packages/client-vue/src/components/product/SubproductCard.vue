<template>
  <section class="m-0 w-full">
    <!-- <pre>{{ props }}</pre> -->
    <header class="flex flex-1 items-start gap-x-1">
      <div class="flex flex-grow flex-col gap-0.5">
        <h5 class="m-0 font-medium">{{ name }}</h5>
        <div class="ml-0">
          <template
            v-for="promotion in props.price?.promotions"
            :key="promotion.id"
          >
            <Badge
              color="promotion"
              class="rounded-md px-1 py-0 text-[12px]"
              variant="tonal"
            >
              {{
                t(
                  "product.promo_save",
                  promotion.mixed || !promotion.amount ? 1 : 0,
                  {
                    item: promotion.amount_formatted,
                  }
                )
              }}</Badge
            >
          </template>
        </div>
      </div>

      <div class="flex flex-col text-right font-semibold">
        <!-- <NumberField
          v-if="canChangeQuantity && modelValue?.[item.id]?.[id]"
          :disabled="processing"
          :min="value?.min_order_quantity"
          :max="value?.max_order_quantity"
          :step="value?.unit_quantity"
          :model-value="
            modelValue[item.id][id]?.unit_quantity || value?.unit_quantity
          "
          @update:modelValue="doUpdateQuantity(item, value, $event)"
          size="sm"
        /> -->

        <span
          class="flex flex-shrink-0 items-center justify-end gap-x-1"
          v-if="props.price?.price"
        >
          <Tooltip v-if="props.price_override" :label="t('product.overrides')">
            <Icon
              icon="transfer"
              size="3xs"
              class="bg-primary text-primary-foreground rounded-full opacity-50 transition-all duration-300 hover:opacity-100"
            />
          </Tooltip>

          <Tooltip v-else :label="t('product.adds')">
            <Icon
              icon="plus"
              size="3xs"
              class="bg-primary text-primary-foreground rounded-full opacity-50 transition-all duration-300 hover:opacity-100"
            />
          </Tooltip>

          {{
            props.price?.price_discounted
              ? props.price?.price_discounted_formatted
              : props.price?.price_formatted
          }}
        </span>

        <span v-else>{{ t("product.free") }}</span>

        <span
          v-if="props.price?.price_discounted"
          class="text-2xs text-base-500 leading-none line-through"
        >
          {{ props.price?.price_formatted }}
        </span>
      </div>
    </header>

    <p
      class="text-base-700 mb-0 mt-2 whitespace-normal text-xs leading-tight"
      v-if="props.short_description"
    >
      {{ props.short_description }}
    </p>
  </section>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { NumberField } from "@upmind/upwind";

// --- components
import { Icon, Tooltip, Badge } from "@upmind/upwind";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  id?: string;
  name: string;
  short_description?: string;
  price_override?: boolean;
  price?: {
    price: number;
    price_formatted: string;
    price_discounted: number;
    price_discounted_formatted: string;
    promotions: Array<{
      id: string;
      amount: number;
      amount_formatted: string;
      mixed: boolean;
    }>;
  };
  canChangeQuantity: boolean;
}>();

// ---

const { t } = useI18n();
</script>
