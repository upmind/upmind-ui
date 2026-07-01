<template>
  <FormField v-bind="formFieldProps">
    <RadioCards
      :name="control.path"
      :model-value="control.data"
      :items="displayedItems"
      v-bind="appliedOptions"
      @update:model-value="onInput"
    >
      <template
        v-if="items.length >= collapseAt && !isExpanded"
        #additional-item="{ size }"
      >
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
import { isEnumControl, and, optionIs, hasOption } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import { FormField, RadioCards, Link } from "@upmind-automation/upmind-ui";
import config from "../form.config";
import { map } from "lodash-es";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { t } = useI18n();
const isExpanded = ref(false);

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

const styles = useStyles("form.radioCollapsible", {}, config);

const collapseAt = computed(() => {
  return appliedOptions.value?.collapse || 4;
});

const displayedItems = computed(() => {
  if (items.value.length < collapseAt.value || isExpanded.value) {
    return items.value;
  }
  return items.value.slice(0, collapseAt.value - 1);
});
</script>

<script lang="ts">
export const tester = {
  rank: 4, // Higher rank than default EnumRadioRenderer (rank 3)
  controlType: and(
    isEnumControl,
    optionIs("format", "radio"),
    hasOption("collapse")
  )
};
</script>
