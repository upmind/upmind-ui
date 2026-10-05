<template>
  <FormField v-bind="formFieldProps">
    <Input
      :id="formFieldProps.id"
      type="text"
      :placeholder="appliedOptions?.placeholder"
      :disabled="!control.enabled"
      :size="appliedOptions?.size"
      :model-value="data ?? ''"
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
import {
  and,
  isStringControl,
  optionIs,
  toDataPathSegments,
  update
} from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import {
  Button,
  Input,
  Tooltip,
  FormField,
  useUpmindUIRenderer
} from "@upmind/ui";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "../icon";
import { get, isEmpty } from "lodash-es";
import type {
  ControlElement,
  CoreActions,
  Dispatch,
  JsonFormsSubStates
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module renderers/FilterSearchRenderer
 * @description A string filter leaf as the bar's search box. The leaf carries the
 * BARE term — the criteria translator adds the wildcards — and an emptied box
 * writes the leaf's unset member rather than an empty string, which its declared
 * `minLength` would reject.
 *
 * A search box is named by its placeholder rather than a label — every `*_search`
 * entry in the catalogue files its `label` as `null`, which is what FormField's
 * own `hasLabel` reads.
 *
 * @decision
 * what: the leaf is written as ONE literal-path `update` and read by the same
 * literal path off the injected core data — the `FilterMultiSelectRenderer`
 * pattern.
 * why: a filter column may carry a literal dot in its name
 * (`"product.category.name"`), and `@jsonforms/core` joins and re-splits the
 * scope on ".", so `control.data` never resolves for it and `handleChange`
 * writes a nested branch that the column's `additionalProperties: false`
 * strips — the term never reaches the wire.
 * rejected: `handleChange(control.path, …)` — correct only for undotted columns.
 */

const props = defineProps<RendererProps<ControlElement>>();

const jsonFormsControl = useJsonFormsControl(props);
const dispatch = inject<Dispatch<CoreActions>>("dispatch");
const jsonforms = inject<JsonFormsSubStates>("jsonforms");

/** The leaf's own literal path — a dotted column name as ONE segment. */
const literalPath = computed(() =>
  toDataPathSegments(jsonFormsControl.control.value.uischema.scope)
);

const handleChange = (_path: string, value: unknown) => {
  dispatch?.(update(literalPath.value as unknown as string, () => value));
};

const { control, appliedOptions, formFieldProps } = useUpmindUIRenderer({
  ...jsonFormsControl,
  handleChange
});

const { t } = useI18n();

const data = computed<string | number | null | undefined>(() =>
  get(jsonforms?.core?.data, literalPath.value)
);

const isSet = computed(() => !isEmpty(data.value));

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
