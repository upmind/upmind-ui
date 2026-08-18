<template>
  <FormField v-bind="formFieldProps">
    <Search
      :id="formFieldProps.id"
      :results="null"
      :placeholder="appliedOptions?.placeholder"
      :disabled="!control.enabled"
      :model-value="control.data ?? ''"
      @update:modelValue="write"
    >
      <!-- Kept mounted and merely hidden while unset: mounting it on first
           keystroke re-widths the whole control mid-type. -->
      <template #append>
        <Tooltip :label="unsetLabel">
          <Button
            icon="x-close"
            icon-only
            variant="ghost"
            color="neutral"
            size="sm"
            :class="{ invisible: !isSet }"
            :label="unsetLabel"
            :disabled="!isSet || !control.enabled"
            @click="write()"
          />
        </Tooltip>
      </template>
    </Search>
  </FormField>
</template>

<script lang="ts" setup>
import { and, isStringControl, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Button,
  FormField,
  Search,
  Tooltip,
  useUpmindUIRenderer
} from "@upmind-automation/upmind-ui";
import { isEmpty } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterSearchRenderer
 * @description A string filter leaf as the bar's search box. The leaf carries the
 * BARE term — the criteria translator adds the wildcards — and an emptied box
 * writes the leaf's unset member rather than an empty string, which its declared
 * `minLength` would reject.
 *
 * A search box is named by its placeholder rather than a label — every `*_search`
 * entry in the catalogue files its `label` as `null`, which is what FormField's
 * own `hasLabel` reads.
 */

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, handleChange } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const { t } = useI18n();

const isSet = computed(() => !isEmpty(control.value.data));

const unsetLabel = computed(() => t("text.all"));

// --- methods

function write(value?: string | number): void {
  // `handleChange`, not the renderer's `onInput`: clearing writes `null`, which
  // `onInput` drops as "not dirty".
  handleChange(control.value.path, isEmpty(value) ? null : value);
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isStringControl, optionIs("format", "search"))
};
</script>
