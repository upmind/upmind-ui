<template>
  <FormField v-bind="formFieldProps">
    <OptionTileGroup
      :name="control.path"
      :model-value="control.data"
      mode="single"
      :data-attrs="{ 'data-test-key': 'option-tile-group' }"
      :disabled="appliedOptions.disabled"
      @update:model-value="onInput"
    >
      <OptionTile
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :data-attrs="{ 'data-test-key': `option-tile-${item.value}` }"
      >
        <template #label>
          {{ item.label }}
          <Badge
            v-if="item.isDefault"
            variant="neutral"
            appearance="outline"
            size="sm"
          >
            {{ t("text.default_label") }}
          </Badge>
        </template>
        <template v-if="item.text || item.appendIcon" #trailing>
          <small v-if="item.text" class="text-faint text-sm">{{
            item.text
          }}</small>
          <Icon
            v-if="item.appendIcon"
            :icon="item.appendIcon.name"
            class="h-5 w-8"
          />
        </template>
      </OptionTile>
    </OptionTileGroup>
  </FormField>
</template>

<script setup lang="ts">
import { isEnumControl, and, scopeEndIs } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge, OptionTileGroup, OptionTile } from "@upmind/ui";
import { Icon } from "../../icon";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { map, get } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

// -----------------------------------------------------------------------------
interface PaymentTile {
  value: string;
  label: string;
  text?: string;
  isDefault?: boolean;
  appendIcon?: { name: string };
}

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { t } = useI18n();

const items = computed<PaymentTile[]>(() => {
  const { options, schema } = control.value;

  return map(
    get(schema, "options") ?? options,
    (option): PaymentTile => ({
      value: option.value,
      label: option.label,
      text: get(option, "text"),
      isDefault: get(option, "isDefault"),
      appendIcon: get(option, "appendIcon")
    })
  );
});
</script>

<script lang="ts">
export const tester = {
  rank: 4,
  controlType: and(
    isEnumControl,
    scopeEndIs("payment_details_id") // Matches if the scope ends with 'payment_details_id'
  )
};
</script>
