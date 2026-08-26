<template>
  <section class="flex w-full flex-col gap-3 text-left" v-auto-animate>
    <header>
      <Link
        size="sm"
        color="muted"
        :disabled="meta.isProcessing"
        @click="toggle = !toggle"
        :checked="toggle"
        :data-attrs="{ 'data-test-key': 'link-add-a-voucher-code' }"
        >{{ t("action.add_promotion") }}</Link
      >
    </header>

    <Form
      v-show="toggle"
      class="grid grid-cols-[1fr_auto] items-start gap-2"
      :additional-errors="validationErrors"
      :loading="meta.isLoading"
      :model-value="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      @reject="clear"
      @resolve="doAdd"
      @update:modelValue="input"
      :actions="actions"
      data-test-key="promotions-form"
    />

    <footer
      class="flex flex-wrap items-center gap-1"
      v-if="meta.hasPromotions"
      v-auto-animate
      v-bind="footerTestAttrs"
    >
      <h4 class="sr-only">
        {{ t("cart.promotions_active") }}
      </h4>

      <Tooltip
        v-for="promotion in promotions"
        :key="promotion.code"
        :open="!!open[promotion.id]"
        @update:open="value => toggleTooltip(promotion.id, value)"
      >
        <Badge
          appearance="solid"
          variant="promo"
          size="md"
          class="cursor-pointer gap-1 rounded-full"
          @click="toggleTooltip(promotion.id)"
          @mouseenter="toggleTooltip(promotion.id, true)"
          @mouseleave="toggleTooltip(promotion.id, false)"
        >
          <Link
            :disabled="meta.isProcessing"
            :loading="!!processing[promotion.id]"
            @click.prevent="doRemove(promotion.id)"
            color="inherit"
          >
            <Icon icon="x-close" size="xs" />
          </Link>
          {{ promotion.code }}
        </Badge>
        <template #content>{{ tooltipLabel(promotion) }}</template>
      </Tooltip>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate";
import { useTestAttrs } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Badge, Tooltip } from "@upmind/ui";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useBasketPromotions,
  type PromotionDetails
} from "@upmind-automation/headless";
import Form from "../../../components/form/Form.vue";
import { Icon } from "../../../components/icon";
import { set } from "lodash-es";
import type { FormActionProps } from "../../../components/form";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const {
  meta,
  validationErrors,
  model,
  schema,
  uischema,
  promotions,
  clear,
  input,
  add,
  remove
} = useBasketPromotions();

// ---
const toggle = ref(false);
const processing = ref<Record<string, boolean>>({});
const open = ref<Record<string, boolean>>({});

function doAdd() {
  add()
    .then(() => (toggle.value = false))
    .catch(() => {
      // do nothing as the error is already handled in the form
    });
}
function doRemove(value: string) {
  set(processing.value, value, true);
  remove(value).catch(() => {
    // do nothing as the error is already handled in the form
  });
}

const toggleTooltip = (id: string, force?: boolean) => {
  open.value[id] = force ?? !open.value[id];
};

const actions = computed((): Record<string, FormActionProps> => {
  return {
    submit: {
      type: "submit" as const,
      label: t("action.apply"),
      size: "lg",
      variant: "subtle",
      needsValid: true,
      dataAttrs: { "data-test-key": "button-apply" }
    }
  };
});

const tooltipLabel = computed(() => (promotion: PromotionDetails) => {
  if (promotion?.price?.savingPrice) {
    return t("cart.promotion_help", {
      code: promotion.code,
      amount: promotion.price.savingPrice,
      description: promotion.excerpt ? `. (${promotion.excerpt})` : ""
    });
  }
  return promotion.name;
});

const footerTestAttrs = useTestAttrs({ key: "summary-footer" });
</script>
