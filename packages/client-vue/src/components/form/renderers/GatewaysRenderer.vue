<template>
  <FormField v-bind="formFieldProps" label="">
    <RadioCards
      :name="control.path"
      v-bind="appliedOptions"
      :model-value="control.data"
      :items="displayItems"
      @update:model-value="onInput"
      :columns="appliedOptions.width ?? 2"
    >
      <template v-if="allowShowMore" #additional-item="{ size }">
        <div :class="[styles.form.radioCollapsible.root, size]">
          <Link
            variant="outline"
            color="muted"
            size="sm"
            :label="t('action.show_more_options')"
            :dataAttrs="{ 'data-test-key': 'show-more-payment-options' }"
            @click="isExpanded = true"
            icon="plus"
          />
        </div>
      </template>
    </RadioCards>
  </FormField>
</template>

<script setup lang="ts">
import { isEnumControl, and, scopeEndIs } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig } from "@upmind-automation/headless";
import { PaymentType } from "@upmind-automation/types";
import { useUpmindUIRenderer, Link } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import { FormField, RadioCards } from "@upmind-automation/upmind-ui";
import config from "../form.config";
import { map, take } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { ui } = useConfig();

const { t } = useI18n();

const isExpanded = ref(false);

const items = computed(() => {
  const { options, schema, data, rootSchema } = control.value;

  const gateways = map(
    // We have an additional prop that we add to the schema called options, like oneOf but more efficient
    (schema as any)?.options ?? options,
    (option, index): RadioCardsItemProps => {
      // Stable, locale-independent test target keyed on the gateway provider
      // code (surfaced from headless) — NOT the dynamic index or translated
      // label. Pay Later adds its own below.
      const provider = (option as { provider?: string }).provider;
      return {
        item: option,
        value: option.value,
        label: option.label,
        secondaryLabel: option?.text,
        index,
        modelValue: data,
        dataAttrs: provider
          ? { "data-test-key": "gateway", "data-test-value": provider }
          : undefined
      };
    }
  );

  // Syntactic Sugar...Add a "special" option to force pay-later.
  if (rootSchema?.definitions?.type?.enum?.includes(PaymentType.PAY_LATER)) {
    gateways.push({
      item: {
        label: t("form.payment_method_type.pay-later"),
        value: PaymentType.PAY_LATER
      },
      value: PaymentType.PAY_LATER,
      label: t("form.payment_method_type.pay-later"),
      index: gateways.length,
      modelValue: data,
      dataAttrs: {
        "data-test-key": "gateway",
        "data-test-value": PaymentType.PAY_LATER
      }
    });
  } else {
    // console.debug("No Pay Later option available");
  }

  return gateways;
});

const styles = useStyles("form.radioCollapsible", {}, config);

const collapseAt = computed(() => {
  return ui.paymentGatewaysCap.asNumber || 5;
});

const allowShowMore = computed(() => {
  return !isExpanded.value && items.value.length > collapseAt.value + 1;
});

const displayItems = computed(() => {
  if (!allowShowMore.value) return items.value;
  return take(items.value, collapseAt.value);
});
</script>

<script lang="ts">
export const tester = {
  rank: 4,
  controlType: and(
    isEnumControl,
    scopeEndIs("gateway_id") // Matches if the scope ends with 'gateway_id'
  )
};
</script>
