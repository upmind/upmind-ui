<template>
  <section :class="styles.card.root">
    <header :class="styles.card.header.root">
      <div :class="styles.card.header.content">
        <div :class="styles.card.header.titleWrapper">
          <div :class="styles.card.header.titleInner">
            <SubproductImage
              v-if="image"
              :src="image"
              :alt="title"
              :minimal="props.minimal"
              :dropdown="props.dropdown"
            />
            <strong :class="styles.card.header.title">
              {{ title }}
              <Tooltip
                v-if="ui.optionItemDescription.isTooltip && desc"
                :label="desc"
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
            </strong>
          </div>

          <Promotion
            v-if="!props.productMeta?.overridden"
            v-for="promotion in props.promotions"
            :key="promotion.code.toString()"
            v-bind="promotion"
            size="sm"
          />

          <Tooltip
            v-if="props.productMeta?.overridden"
            :label="t('text.price_manually_adjusted_msg')"
          >
            <Badge
              :label="t('text.custom_price')"
              size="sm"
              variant="muted"
              color="warning"
            />
          </Tooltip>
        </div>

        <div v-if="props.price" :class="styles.card.pricing.sm">
          <SubproductCardPricing
            :price="props.price"
            :meta="props.productMeta"
            :cycle="props.cycle"
            :term="props.term"
            :class="styles.card.pricing.text"
            :dropdown="props.dropdown"
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

        <div v-if="props.price" :class="styles.card.pricing.lg">
          <SubproductCardPricing
            :price="props.price"
            :meta="props.productMeta"
            :cycle="props.cycle"
            :class="styles.card.pricing.text"
            :term="props.term"
            :dropdown="props.dropdown"
          />
        </div>
      </div>
    </header>

    <Markdown
      v-if="ui.optionItemDescription.isInline && desc"
      :class="styles.card.excerpt"
      :model-value="desc"
    />
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./subproduct-card.config";

// --- components
import {
  Badge,
  NumberField,
  Tooltip,
  Icon,
  Markdown
} from "@upmind-automation/upmind-ui";
import SubproductCardPricing from "./SubproductCardPricing.vue";
import SubproductImage from "./SubproductImage.vue";
import Promotion from "../../../basket-product/components/card/components/Promotion.vue";

// --- types
import type { SubproductCardProps } from "./types";

// -----------------------------------------------------------------------------

const emit = defineEmits(["update:quantity"]);
const props = defineProps<SubproductCardProps>();

const meta = computed(() => ({
  isMinimal: props.minimal,
  isDropdown: props.dropdown
}));

const { ui } = props.meta.with({
  option: () => props
});

const { t } = useI18n();

const tooltipOpen = ref(false);

function toggleTooltip(force?: boolean) {
  tooltipOpen.value = force ?? !tooltipOpen.value;
}

const styles = useStyles(["card", "card.header", "card.pricing"], meta, config);

const desc = computed(() => props.excerpt || props.description);

function doUpdateQuantity(quantity: number | undefined) {
  if (!quantity) return;
  emit("update:quantity", quantity);
}
</script>
