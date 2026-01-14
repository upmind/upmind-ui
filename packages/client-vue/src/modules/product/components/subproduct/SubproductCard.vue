<template>
  <section :class="styles.card.root">
    <header :class="styles.card.header.root">
      <div :class="styles.card.header.content">
        <div :class="styles.card.header.titleWrapper">
          <h5 :class="styles.card.header.title">
            {{ title }}
            <Tooltip
              v-if="
                ui.optionItemDescription.isTooltip && !isEmpty(props.excerpt)
              "
              :label="props.excerpt"
              :open="tooltipOpen"
              :class="styles.card.header.tooltip"
              :uiConfig="
                {
                  tooltip: {
                    trigger: [styles.card.header.trigger]
                  }
                } as any
              "
            >
              <Icon
                @click="toggleTooltip()"
                @mouseenter="toggleTooltip(true)"
                @mouseleave="toggleTooltip(false)"
                icon="info-circle"
                size="nano"
                :class="styles.card.header.icon"
              />
            </Tooltip>
          </h5>

          <Promotion
            v-for="promotion in props.promotions"
            :key="promotion.code.toString()"
            v-bind="promotion"
            size="sm"
          />
        </div>

        <div
          v-if="props.price && !props.productMeta?.free"
          :class="styles.card.pricing.sm"
        >
          <SubproductCardPricing
            v-if="props.price"
            :price="props.price"
            :meta="props.productMeta"
            :cycle="props.cycle"
            :term="props.term"
          />
        </div>
      </div>

      <div :class="styles.card.header.actions">
        <NumberField
          v-if="quantifiable && quantity"
          :disabled="processing"
          :min="min"
          :max="max"
          :step="step"
          :model-value="quantity"
          :default-value="quantity || step"
          @update:model-value="doUpdateQuantity"
          size="sm"
          width="sm"
          variant="minimal"
          @click.stop
          @keydown.enter.prevent.stop
        />

        <div :class="styles.card.pricing.lg">
          <SubproductCardPricing
            v-if="props.price"
            :price="props.price"
            :meta="props.productMeta"
            :cycle="props.cycle"
            :term="props.term"
          />
        </div>
      </div>
    </header>

    <p
      v-if="ui.optionItemDescription.isInline && props.excerpt"
      :class="styles.card.excerpt"
    >
      {{ props.excerpt }}
    </p>
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./subproduct-card.config";

// --- components
import { NumberField, Tooltip, Icon } from "@upmind-automation/upmind-ui";
import { isEmpty } from "lodash-es";
import SubproductCardPricing from "./SubproductCardPricing.vue";
import Promotion from "../../../basket-product/components/card/components/Promotion.vue";

// --- types
import type { SubproductCardProps } from "./types";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:quantity"]);
const props = defineProps<SubproductCardProps>();

const meta = computed(() => ({
  isMinimal: props.minimal
}));

const { ui } = props.meta.with({
  option: () => props
});

const tooltipOpen = ref(false);

function toggleTooltip(force?: boolean) {
  tooltipOpen.value = force ?? !tooltipOpen.value;
}

const styles = useStyles(["card", "card.header", "card.pricing"], meta, config);

function doUpdateQuantity(quantity: number | undefined) {
  if (!quantity) return;
  emit("update:quantity", quantity);
}
</script>
