<template>
  <FormField v-bind="formFieldProps">
    <Input
      :id="formFieldProps.id"
      type="text"
      :placeholder="appliedOptions?.placeholder"
      :disabled="!control.enabled"
      :size="appliedOptions?.size"
      :model-value="control.data ?? ''"
      @update:modelValue="write"
    >
      <template v-if="appliedOptions?.icon" #leading>
        <Icon :icon="appliedOptions.icon" size="xs" />
      </template>

      <!-- Kept mounted and merely hidden while unset: mounting it on first
           keystroke re-widths the whole control mid-type. -->
      <template #trailing>
        <Tooltip :label="unsetLabel">
          <Button
            icon-only
            variant="link"
            size="sm"
            :class="{ invisible: !isSet }"
            :aria-label="unsetLabel"
            :disabled="!isSet || !control.enabled"
            @click="write()"
          >
            <Icon icon="x-close" size="xs" />
          </Button>
        </Tooltip>
      </template>
    </Input>
  </FormField>
</template>

<script lang="ts" setup>
import { and, isStringControl, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { Button, Input, Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "../../icon";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
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
