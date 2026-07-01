<template>
  <FormField v-bind="formFieldProps">
    <RadioCards
      :name="control.path"
      v-bind="appliedOptions"
      :model-value="control.data"
      :items="items"
      @update:model-value="onInput"
    >
      <template #item="{ item }">
        <div :class="styles.form.payment.root">
          <header :class="styles.form.payment.header.root">
            <h5 :class="styles.form.payment.header.label">{{ item?.label }}</h5>

            <Badge
              v-if="item?.isDefault"
              v-bind="item.badge"
              :label="t('text.default_label')"
              color="neutral"
              variant="minimal"
              size="sm"
            />
          </header>
          <footer
            v-if="item?.text || item?.appendIcon"
            :class="styles.form.payment.footer.root"
          >
            <small
              v-if="item?.text"
              :class="styles.form.payment.footer.label"
              >{{ item?.text }}</small
            >
            <Icon
              v-if="item?.appendIcon"
              :icon="item?.appendIcon?.name"
              :class="styles.form.payment.footer.icon"
            />
          </footer>
        </div>
      </template>
    </RadioCards>
  </FormField>
</template>

<script setup lang="ts">
import { isEnumControl, and, scopeEndIs } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import {
  FormField,
  RadioCards,
  Icon,
  Badge
} from "@upmind-automation/upmind-ui";
import config from "../form.config";
import { map } from "lodash-es";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { t } = useI18n();

const styles = useStyles(
  ["form.payment", "form.payment.header", "form.payment.footer"],
  {},
  config
);

const items = computed(() => {
  const { options, schema, data } = control.value as {
    options: (EnumOption & { text?: string })[];
    schema: JsonSchema & { options?: (EnumOption & { text?: string })[] };
    data: any;
  };

  return map(
    schema.options ?? options,
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
});
</script>

<script lang="ts">
export const tester = {
  rank: 4,
  controlType: and(
    isEnumControl,
    scopeEndIs("payment_details_id") // Matches if the scope ends with 'gateway_id'
  )
};
</script>
