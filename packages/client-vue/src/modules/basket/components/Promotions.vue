<template>
  <section class="flex w-full flex-col gap-3 text-left" v-auto-animate>
    <header>
      <Link
        :label="t('action.add_promotion')"
        size="sm"
        color="muted"
        :disabled="meta.isProcessing"
        @click="toggle = !toggle"
        :checked="toggle"
        data-testid="link-add-a-voucher-code"
      />
    </header>

    <Form
      v-show="toggle"
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
      :ui-config="formConfig"
      data-testid="promotions-form"
    />

    <footer
      class="flex flex-wrap items-center gap-1"
      v-if="meta.hasPromotions"
      v-auto-animate
      data-testid="summary-footer"
    >
      <h4 class="sr-only">
        {{ t("cart.promotions_active") }}
      </h4>

      <Tooltip
        v-for="promotion in promotions"
        :key="promotion.code"
        :label="tooltipLabel(promotion)"
        :open="!!open[promotion.id]"
        :ui-config="{ trigger: ['rounded-pill'] }"
      >
        <Badge
          variant="solid"
          color="promo"
          size="md"
          :label="promotion.code"
          @click="toggleTooltip(promotion.id)"
          @mouseenter="toggleTooltip(promotion.id, true)"
          @mouseleave="toggleTooltip(promotion.id, false)"
        >
          <template #prepend>
            <Link
              :disabled="meta.isProcessing"
              :loading="!!processing[promotion.id]"
              @click.prevent="doRemove(promotion.id)"
              color="inherit"
            >
              <Icon icon="x-close" size="nano" />
            </Link>
          </template>
        </Badge>
      </Tooltip>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate";
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useBasketPromotions,
  type PromotionDetails
} from "@upmind-automation/headless";
import { Icon, Badge, Tooltip, Link } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";
import config from "../basket.config";
import { set } from "lodash-es";
import type { FormActionProps, FormProps } from "@upmind-automation/upmind-ui";
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

const formConfig = config.basket.promotions as unknown as FormProps["uiConfig"];

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
      dataAttrs: { "data-testid": "button-apply" }
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
</script>
