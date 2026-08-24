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
        v-for="item in displayedItems"
        :key="item.value"
        :value="item.value"
        :data-attrs="{ 'data-test-key': `option-tile-${item.value}` }"
        :label="item.label"
        :description="item.secondaryLabel"
      />
    </OptionTileGroup>

    <Link
      v-if="items.length >= collapseAt && !isExpanded"
      color="muted"
      size="sm"
      class="mt-1 inline-flex items-center justify-start gap-1 px-3"
      @click="isExpanded = true"
    >
      <Icon icon="plus" /> {{ t("action.show_more_options") }}
    </Link>
  </FormField>
</template>

<script setup lang="ts">
import { isEnumControl, and, optionIs, hasOption } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Link, OptionTileGroup, OptionTile } from "@upmind/ui";
import { Icon } from "../../icon";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { map, get } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

// -----------------------------------------------------------------------------
interface EnumTile {
  value: string;
  label: string;
  secondaryLabel?: string;
}

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, onInput } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

const { t } = useI18n();
const isExpanded = ref(false);

const items = computed<EnumTile[]>(() => {
  const { options, schema } = control.value;

  return map(
    get(schema, "options") ?? options,
    (option): EnumTile => ({
      value: option.value,
      label: option.label,
      secondaryLabel: get(option, "text")
    })
  );
});

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
