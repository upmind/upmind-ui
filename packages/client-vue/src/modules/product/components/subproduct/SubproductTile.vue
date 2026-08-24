<template>
  <OptionTile
    :value="option.id"
    :data-attrs="{ 'data-test-key': `option-tile-${option.id}` }"
    :label="option.title"
  >
    <!-- option image (a small logo affix), gated upstream by optionSelectorIcons -->
    <template v-if="option.image" #leading>
      <img
        :src="option.image"
        :alt="option.title"
        class="size-5 shrink-0 object-contain object-center"
      />
    </template>

    <!-- Title line: tooltip info trigger (if any) plus, on the compact layout
         only, the quantity stepper pinned right of the title — the wide layout
         keeps the stepper in #trailing instead. -->
    <template
      v-if="(option.descriptionIsTooltip && desc) || showQuantity"
      #label
    >
      <!-- Title grows to floor the stepper hard-right on the title line. -->
      <span class="flex min-w-0 flex-1 items-center gap-2">
        <span>{{ option.title }}</span>

        <Tooltip v-if="option.descriptionIsTooltip && desc">
          <Icon
            icon="info-circle"
            size="xs"
            class="text-muted hover:text-body cursor-help transition-colors"
          />
          <template #content>{{ desc }}</template>
        </Tooltip>
      </span>

      <!-- Quantity stepper, floored right of the title (the title above grows
           to push it there). Events stopped so operating it can't toggle the
           tile — the #trailing guard doesn't reach #label. -->
      <span
        v-if="showQuantity"
        class="shrink-0"
        @click.stop
        @pointerdown.stop
        @keydown.stop
      >
        <NumberField
          :model-value="quantity"
          :default-value="quantity || option.step"
          :min="option.min"
          :max="option.max"
          :step="option.step"
          :disabled="processing"
          variant="minimal"
          size="sm"
          class-field="h-5"
          @update:model-value="onQuantity"
        />
      </span>
    </template>

    <!-- inline-mode description: markdown under the title -->
    <template v-if="option.descriptionIsInline && desc" #description>
      <Markdown :model-value="desc" class="[&_p]:m-0" />
    </template>

    <template v-if="hasTrailing" #trailing>
      <Promotion
        v-for="promotion in promotions"
        :key="promotion.code.toString()"
        v-bind="promotion"
        size="sm"
      />

      <Tooltip v-if="isCustom">
        <Badge size="sm" appearance="muted" variant="warning">
          {{ t("text.custom_price") }}
        </Badge>
        <template #content>{{
          t("text.price_manually_adjusted_msg")
        }}</template>
      </Tooltip>

      <SubproductPrice
        v-if="option.price"
        :price="option.price"
        :meta="option.meta"
        :term="term"
      />
    </template>
  </OptionTile>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind/ui";
import { OptionTile } from "@upmind/ui";
import { Markdown, NumberField, Tooltip } from "@upmind/ui";
import { Icon } from "../../../../components/icon";
import Promotion from "../../../basket-product/components/card/components/Promotion.vue";
import SubproductPrice from "./SubproductPrice.vue";
import type { SubproductOption } from "./types";

// -----------------------------------------------------------------------------
// Renders one subproduct option as an OptionTile — title/description as data,
// image/price/promotions/quantity as trailing-or-leading affixes. The OLD
// CardSubproduct layout, expressed through the new component instead of a slot.

const props = defineProps<{
  option: SubproductOption;
  term?: number;
  quantity?: number;
  processing?: boolean;
}>();

const emit = defineEmits<{
  "update:quantity": [quantity: number];
}>();

const { t } = useI18n();

const desc = computed(() => props.option.excerpt || props.option.description);
const isCustom = computed(() => !!props.option.meta?.custom);
const promotions = computed(() =>
  isCustom.value ? [] : (props.option.promotions ?? [])
);

const showPrice = computed(
  () =>
    !!props.option.price &&
    (!props.option.meta?.free || props.option.meta?.overrides)
);
const showQuantity = computed(
  () => !!props.option.quantifiable && !!props.quantity
);
// The quantity stepper lives on the title line (#label), not here, so the
// trailing renders only for price/promo/badge — no empty trailing (and its
// stacked gap) when a quantifiable option has no price.
const hasTrailing = computed(
  () => showPrice.value || isCustom.value || promotions.value.length > 0
);

function onQuantity(value: number | undefined) {
  if (!value) return;
  emit("update:quantity", value);
}
</script>
