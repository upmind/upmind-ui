<template>
  <FormField v-bind="formFieldProps" label="">
    <OptionTileGroup
      :name="control.path"
      :model-value="control.data"
      mode="single"
      :layout="layout"
      :min-tile-width="minTileWidth"
      :disabled="appliedOptions.disabled"
      @update:model-value="onInput"
    >
      <OptionTile
        v-for="gateway in displayItems"
        :key="gateway.value"
        :value="gateway.value"
        :label="gateway.label"
        :description="gateway.secondaryLabel"
        v-bind="gateway.dataAttrs"
      />
    </OptionTileGroup>

    <Link
      v-if="allowShowMore"
      color="muted"
      size="sm"
      :data-attrs="{ 'data-test-key': 'show-more-payment-options' }"
      class="mt-1 inline-flex items-center justify-start gap-1 px-3"
      @click="isExpanded = true"
    >
      <Icon icon="plus" /> {{ t("action.show_more_options") }}
    </Link>
  </FormField>
</template>

<script setup lang="ts">
import { isEnumControl, and, scopeEndIs } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useConfig } from "@upmind-automation/headless";
import { Link, OptionTileGroup, OptionTile } from "@upmind/ui";
import { PaymentType } from "@upmind-automation/types";
import { Icon } from "../../icon";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { map, take, get } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

// -----------------------------------------------------------------------------
// The schema's `options` carry a `text` secondary label alongside JSONForms'
// own EnumOption fields — ours, so declare it rather than assert it.
interface GatewaySchemaOption {
  value: string;
  label: string;
  text?: string;
  provider?: string;
}

interface GatewayTile {
  value: string;
  label: string;
  secondaryLabel?: string;
  dataAttrs?: Record<string, string>;
}

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { ui } = useConfig();

const { t } = useI18n();

const isExpanded = ref(false);

// Old RadioCards used a fixed column count; the new grid auto-fits by min tile
// width. >1 column → a corner-marked grid, single column → a leading-marked stack.
const columns = computed(() => appliedOptions.value?.width ?? 2);
const isGrid = computed(() => columns.value > 1);
const layout = computed(() => {
  if (isGrid.value) return "grid";
  return "stack";
});
const minTileWidth = computed(() => {
  if (columns.value >= 3) return "12rem";
  return "16rem";
});

const items = computed<GatewayTile[]>(() => {
  const { options, schema, rootSchema } = control.value;

  // We have an additional prop that we add to the schema called options, like
  // oneOf but more efficient.
  const schemaOptions: GatewaySchemaOption[] =
    get(schema, "options") ?? options;

  const gateways = map(schemaOptions, (option): GatewayTile => {
    // Stable, locale-independent test target keyed on the gateway provider
    // code (surfaced from headless) — NOT the dynamic index or translated
    // label. Pay Later adds its own below.
    const provider = get(option, "provider");
    const tile: GatewayTile = {
      value: option.value,
      label: option.label,
      secondaryLabel: option?.text,
      dataAttrs: provider
        ? { "data-test-key": "gateway", "data-test-value": provider }
        : undefined
    };
    return tile;
  });

  // Syntactic Sugar...Add a "special" option to force pay-later.
  if (rootSchema?.definitions?.type?.enum?.includes(PaymentType.PAY_LATER)) {
    gateways.push({
      value: PaymentType.PAY_LATER,
      label: t("form.payment_method_type.pay-later"),
      dataAttrs: {
        "data-test-key": "gateway",
        "data-test-value": PaymentType.PAY_LATER
      }
    });
  }

  return gateways;
});

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
