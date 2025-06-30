<template>
  <section class="flex w-full flex-col gap-3 text-left" v-auto-animate>
    <header>
      <Link
        :label="t('basket.promotions.title')"
        size="sm"
        variant="muted"
        :disabled="meta.isProcessing"
        @click="toggle = !toggle"
      >
        <template v-slot:append>
          <Icon
            icon="arrow-down"
            class="size-6 transition-all aria-checked:rotate-180"
            :aria-checked="toggle"
            aria-hidden="true"
          />
        </template>
      </Link>
    </header>

    <Form
      v-show="toggle"
      :additional-errors="validationErrors"
      :loading="meta.isLoading"
      :model-value="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      color="primary"
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
    >
      <h4 class="sr-only">
        {{ t("basket.promotions.active.title") }}
      </h4>

      <Tooltip
        v-for="promotion in promotions"
        :key="promotion.promotion.code"
        :label="tooltipLabel(promotion)"
        :open="!!open[promotion.id]"
        :ui-config="{ trigger: 'rounded-pill' }"
      >
        <Badge
          color="promotion"
          variant="tonal"
          size="md"
          :label="promotion.promotion.code"
          @click="toggleTooltip(promotion.id)"
          @mouseenter="toggleTooltip(promotion.id, true)"
          @mouseleave="toggleTooltip(promotion.id, false)"
        >
          <template #prepend>
            <Button
              :disabled="meta.isProcessing"
              :loading="!!processing[promotion.id]"
              @click.prevent="doRemove(promotion.id)"
              variant="tonal"
              color="promotion"
              class="-ml-1 mr-1 h-4 w-4 px-0"
              :spinner="false"
            >
              <Icon icon="close" size="2xs" />
            </Button>
          </template>
        </Badge>
      </Tooltip>
    </footer>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";
import { set } from "lodash-es";
import { cva } from "class-variance-authority";

// --- components
import Form from "../../../components/form/Form.vue";

// --- custom elements
import {
  Button,
  Icon,
  Badge,
  Tooltip,
  Link
} from "@upmind-automation/upmind-ui";

// --- internal
import { useBasketPromotions } from "@upmind-automation/headless";
import config from "../basket.config";

// --- types
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
      type: "submit" as "submit",
      label: t("basket.promotions.actions.submit"),
      size: "sm",
      variant: "ghost",
      color: "secondary",
      needsValid: true
    }
  };
});

const tooltipLabel = computed(() => ({ promotion }: any) => {
  if (promotion.amountFormatted) {
    return t("basket.promotions.active.tooltip", {
      code: promotion.code,
      amount: promotion.amountFormatted,
      description: promotion.excerpt ? `. (${promotion.excerpt})` : ""
    });
  }
  return promotion.name;
});
</script>
