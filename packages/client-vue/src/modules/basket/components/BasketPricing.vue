<template>
  <Section
    id="basket-summary"
    :label="t('cart.basket_section')"
    icon="shopping-bag-02"
    :class="styles.basket.aside"
  >
    <Summary :show-total="props.showTotal" />

    <footer v-if="props.showCheckout" class="w-full">
      <BasketCheckout
        @resolve="doResolve"
        :disabled="props.disabled"
        :loading="props.loading"
      />
    </footer>

    <slot name="errors" />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../basket.config";

// --- components
import Summary from "./Summary.vue";
import Section from "../../../components/section/Section.vue";

// --- types
import { BASKET_TEMPLATE } from "../types";
import BasketCheckout from "./BasketCheckout.vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    layout?: BASKET_TEMPLATE;
    disabled?: boolean;
    loading?: boolean;
    showCheckout?: boolean;
    showTotal?: boolean;
  }>(),
  {
    layout: BASKET_TEMPLATE.FULL,
    showCheckout: true,
    showTotal: true
  }
);

const emit = defineEmits<{
  (e: "resolve"): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const styles = useStyles(["basket.aside"], { variant: props.layout }, config);

function doResolve() {
  emit("resolve");
}
</script>
