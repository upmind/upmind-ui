<template>
  <FormField v-if="subproductData" v-bind="fieldProps">
    <SubproductCards
      :subproduct="subproductData"
      :meta="configMeta"
      :model-value="keys(control.data)"
      :quantities="quantities"
      :disabled="formFieldProps.disabled"
      :term="currentTerm"
      @update:modelValue="handleSelection"
      @update:quantity="handleQuantity"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";
import { useI18n } from "vue-i18n";
import { computed, inject } from "vue";

// --- components
import { FormField } from "@upmind-automation/upmind-ui";
import SubproductCards from "../../../modules/product/components/subproduct/SubproductCards.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { useConfig } from "@upmind-automation/headless";
import {
  cloneDeep,
  compact,
  first,
  forEach,
  get,
  isArray,
  keys,
  last,
  reduce,
  set,
  split
} from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { SubproductDetails } from "@upmind-automation/headless";
import type { JsonFormsSubStates } from "@jsonforms/core";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();
const { t } = useI18n();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const configMeta = useConfig()!;

const jsonforms = inject<JsonFormsSubStates>("jsonforms");
const currentTerm = computed(() => jsonforms?.core?.data?.term);

// --- context

/** Whether this is an "options" or "attributes" subproduct. */
const subproductType = computed(() => first(split(control.value.path, ".")));

const subproductData = computed<SubproductDetails | undefined>(() => {
  if (!appliedOptions.value?.meta) return undefined;

  return {
    id: last(split(control.value.path, ".")) ?? "",
    name: control.value.schema?.title ?? "",
    title: control.value.schema?.title ?? "",
    description: control.value.schema?.description ?? "",
    meta: appliedOptions.value.meta ?? {},
    uiMeta: appliedOptions.value.uiMeta ?? {},
    uiCategoryMeta: appliedOptions.value.uiCategoryMeta ?? {},
    values: get(control.value.schema, "options", [])
  } as SubproductDetails;
});

/** FormField props extended with tooltip/description/icon from config meta. */
const fieldProps = computed(() => {
  if (!subproductData.value) return formFieldProps.value;

  const { ui, data } = configMeta.with({
    optionGroup: () => subproductData.value!
  });

  const description = control.value.description ?? "";

  return {
    ...formFieldProps.value,
    description: ui.optionGroupDescription.isInline ? description : "",
    icon: ui.optionSelectorIcons.isVisible ? data.optionGroupIcon : "",
    optionalText: t("text.optional"),
    tooltip: ui.optionGroupDescription.isTooltip ? description : ""
  };
});

/** Extract quantities keyed by value ID from the object model. */
const quantities = computed<Record<string, number>>(() => {
  return reduce(
    control.value.data,
    (result: Record<string, number>, { quantity }: any, productId: string) => {
      if (productId) {
        set(result, productId, quantity);
      }
      return result;
    },
    {}
  );
});

// --- methods

/**
 * Handle selection change from SubproductCards.
 * Mimics setOptions/setAttributes from useProductConfig:
 * - Options: preserve quantity from previous selection
 * - Attributes: only productId (no quantity)
 */
function handleSelection(values: string | string[]) {
  const previousData = control.value.data ?? {};
  const safeValues = compact(isArray(values) ? values : [values]);
  const updated: Record<string, any> = {};
  const isOption = subproductType.value === "options";

  forEach(safeValues, value => {
    const entry: { productId: string; quantity?: number } = {
      productId: value
    };

    // Options preserve quantity from previous state (like setOptions)
    // Attributes never carry quantity (like setAttributes)
    if (isOption) {
      const quantity = get(previousData, [value, "quantity"]);
      if (quantity) {
        entry.quantity = quantity;
      }
    }

    set(updated, value, entry);
  });

  onInput(updated);
}

/**
 * Handle quantity change from SubproductCards.
 * Mimics updateOptionQuantity from useProductConfig.
 */
function handleQuantity(valueId: string, qty: number) {
  const data = cloneDeep(control.value.data ?? {});
  set(data, [valueId, "quantity"], qty);
  onInput(data);
}
</script>

<script lang="ts">
import { uiTypeIs } from "@jsonforms/core";

export const tester = {
  rank: 5,
  controlType: uiTypeIs("SubProducts")
};
</script>
