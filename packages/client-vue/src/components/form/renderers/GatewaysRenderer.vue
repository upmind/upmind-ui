<template>
  <FormField v-bind="formFieldProps" label="">
    <RadioCards
      :name="control.path"
      v-bind="appliedOptions"
      :model-value="control.data"
      :items="displayItems"
      @update:model-value="onInput"
    >
      <template v-if="allowShowMore" #additional-item="{ size }">
        <div :class="[styles.form.radioCollapsible.root, size]">
          <Link
            variant="outline"
            color="muted"
            size="sm"
            :label="t('action.show_more_options')"
            @click="isExpanded = true"
            icon="plus"
          />
        </div>
      </template>
    </RadioCards>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useUpmindUIRenderer, Link } from "@upmind-automation/upmind-ui";
import config from "../form.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { FormField, RadioCards } from "@upmind-automation/upmind-ui";

// --- utils
import { map, take } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { t } = useI18n();

const isExpanded = ref(false);

const items = computed(() => {
  const { options, schema, data, rootSchema } = control.value;

  const gateways = map(
    // We have an additional prop that we add to the schema called options, like oneOf but more efficient
    (schema as any)?.options ?? options,
    (option, index): RadioCardsItemProps => {
      return {
        item: option,
        value: option.value,
        label: option.label,
        secondaryLabel: option?.text,
        index,
        modelValue: data
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
      modelValue: data
    });
  }

  return gateways;
});

const styles = useStyles("form.radioCollapsible", {}, config) as ComputedRef<{
  form: {
    radioCollapsible: {
      root: string;
    };
  };
}>;

const collapseAt = computed(() => {
  return appliedOptions.value?.collapse || 4;
});

const allowShowMore = computed(() => {
  return !isExpanded.value && items.value.length > collapseAt.value;
});

const displayItems = computed(() => {
  if (!allowShowMore.value) return items.value;
  return take(items.value, collapseAt.value - 1);
});
</script>

<script lang="ts">
import { isEnumControl, and, scopeEndIs } from "@jsonforms/core";
import { PaymentType } from "../../../../../types/src";
export const tester = {
  rank: 4,
  controlType: and(
    isEnumControl,
    scopeEndIs("gateway_id") // Matches if the scope ends with 'gateway_id'
  )
};
</script>
