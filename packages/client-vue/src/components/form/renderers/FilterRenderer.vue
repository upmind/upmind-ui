<template>
  <FormField v-bind="fieldProps">
    <ButtonGroup
      v-if="isButtonGroup"
      :items="buttonGroupItems"
      :disabled="fieldProps.disabled"
      size="sm"
    />

    <ToggleGroup
      v-else-if="isToggleGroup"
      :items="stateItems"
      :model-value="selected"
      :disabled="fieldProps.disabled"
      size="sm"
      @update:model-value="onPick"
    />

    <Search
      v-else-if="branch === FilterBranch.Search"
      :id="fieldProps.id"
      :results="null"
      :model-value="toString(leaf(RequestFilterOperator.LIKE))"
      :placeholder="fieldProps.placeholder"
      :disabled="fieldProps.disabled"
      @update:model-value="write(RequestFilterOperator.LIKE, $event)"
    >
      <template v-if="isSet" #append>
        <Tooltip :label="unsetLabel">
          <Button
            icon="x-close"
            icon-only
            variant="ghost"
            color="neutral"
            size="sm"
            :label="unsetLabel"
            :disabled="fieldProps.disabled"
            @click="write(RequestFilterOperator.LIKE, undefined)"
          />
        </Tooltip>
      </template>
    </Search>

    <div
      v-else-if="branch === FilterBranch.Select"
      class="flex flex-row flex-nowrap items-center gap-x-3"
    >
      <Select
        :id="fieldProps.id"
        :items="selectItems"
        :model-value="selected"
        :placeholder="fieldProps.placeholder"
        :disabled="fieldProps.disabled"
        @update:model-value="onPick"
      />
      <Tooltip v-if="isSet" :label="unsetLabel">
        <Button
          icon="x-close"
          icon-only
          variant="ghost"
          color="neutral"
          size="sm"
          :label="unsetLabel"
          :disabled="fieldProps.disabled"
          @click="write(RequestFilterOperator.EQUAL, undefined)"
        />
      </Tooltip>
    </div>

    <div
      v-else-if="branch === FilterBranch.Range"
      class="flex flex-row flex-nowrap items-center gap-x-3"
    >
      <Input
        :id="`${fieldProps.id}-from`"
        :type="isNumericRange ? 'number' : 'text'"
        :disabled="fieldProps.disabled"
        :model-value="
          toString(leaf(RequestFilterOperator.GREATER_THAN_OR_EQUAL))
        "
        @update:model-value="
          write(RequestFilterOperator.GREATER_THAN_OR_EQUAL, $event)
        "
      />
      <span aria-hidden="true">&ndash;</span>
      <Input
        :id="`${fieldProps.id}-to`"
        :type="isNumericRange ? 'number' : 'text'"
        :disabled="fieldProps.disabled"
        :model-value="toString(leaf(RequestFilterOperator.LESS_THAN_OR_EQUAL))"
        @update:model-value="
          write(RequestFilterOperator.LESS_THAN_OR_EQUAL, $event)
        "
      />
    </div>
  </FormField>
</template>

<script lang="ts" setup>
import { uiTypeIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed, inject, watch } from "vue";
import { RequestFilterOperator } from "@upmind-automation/headless";
import {
  Button,
  ButtonGroup,
  ButtonGroupTypes,
  FormField,
  Input,
  Search,
  Select,
  ToggleGroup,
  Tooltip,
  FORM_FIELD_LAYOUT,
  useUpmindUIRenderer
} from "@upmind-automation/upmind-ui";
import {
  FilterBranch,
  FilterTreatment,
  FILTER_STATES_OPTION,
  FILTER_TREATMENT_OPTION,
  FILTER_UNSET_I18N_KEY,
  FILTER_UNSET_VALUE,
  FILTER_UNSUPPORTED_I18N_KEY
} from "./FilterRenderer.types";
import {
  assign,
  castArray,
  concat,
  find,
  first,
  get,
  includes,
  intersection,
  isArray,
  isEmpty,
  isNil,
  isPlainObject,
  keys,
  map,
  omit,
  toString,
  xor
} from "lodash-es";
import type { FilterOption } from "./FilterRenderer.types";
import type { ControlElement, JsonFormsSubStates } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type {
  ButtonGroupItem,
  FormControlProps,
  ToggleGroupItem
} from "@upmind-automation/upmind-ui";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const jsonforms = inject<JsonFormsSubStates>("jsonforms");

const { control, formFieldProps, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

// --- computed

/** The column's declared operators — its schema `properties` keys. */
const operators = computed(() => get(control.value.schema, "properties", {}));

const options = computed<FilterOption[]>(() => {
  const leafSchema = get(operators.value, RequestFilterOperator.EQUAL, {});
  const members = get(leafSchema, "oneOf");

  if (!isEmpty(members))
    return map(members, member => ({
      value: toString(get(member, "const")),
      const: get(member, "const"),
      title: translate(get(member, "title"))
    }));

  return map(get(leafSchema, "enum", []), member => ({
    value: toString(member),
    const: member,
    title: toString(member)
  }));
});

const branch = computed<FilterBranch>(() => {
  const declared = keys(operators.value);

  if (
    isEmpty(
      xor(declared, [
        RequestFilterOperator.GREATER_THAN_OR_EQUAL,
        RequestFilterOperator.LESS_THAN_OR_EQUAL
      ])
    )
  )
    return FilterBranch.Range;

  if (
    isEmpty(xor(declared, [RequestFilterOperator.LIKE])) &&
    includes(typesOf(RequestFilterOperator.LIKE), "string")
  )
    return FilterBranch.Search;

  if (isEmpty(xor(declared, [RequestFilterOperator.EQUAL]))) {
    if (includes(typesOf(RequestFilterOperator.EQUAL), "boolean"))
      return FilterBranch.Boolean;

    if (
      !isEmpty(options.value) &&
      !isEmpty(
        intersection(typesOf(RequestFilterOperator.EQUAL), [
          "string",
          "number",
          "integer"
        ])
      )
    )
      return FilterBranch.Select;
  }

  return FilterBranch.Unsupported;
});

const treatment = computed(() =>
  get(
    control.value.uischema,
    ["options", FILTER_TREATMENT_OPTION],
    FilterTreatment.ButtonGroup
  )
);

/** Position value → the i18n key naming that position's state. */
const stateKeys = computed<Record<string, string>>(() =>
  get(control.value.uischema, ["options", FILTER_STATES_OPTION], {})
);

const isToggleGroup = computed(
  () =>
    branch.value === FilterBranch.Boolean &&
    treatment.value === FilterTreatment.ToggleGroup
);

const isButtonGroup = computed(
  () =>
    branch.value === FilterBranch.Boolean &&
    treatment.value !== FilterTreatment.ToggleGroup
);

const isNumericRange = computed(
  () =>
    !isEmpty(
      intersection(typesOf(RequestFilterOperator.GREATER_THAN_OR_EQUAL), [
        "number",
        "integer"
      ])
    )
);

const isSet = computed(() => !isEmpty(control.value.data));

const unsetLabel = computed(() => translate(FILTER_UNSET_I18N_KEY));

const selected = computed(() => {
  const value = leaf(RequestFilterOperator.EQUAL);
  return isNil(value) ? FILTER_UNSET_VALUE : toString(value);
});

const selectItems = computed(() =>
  map(options.value, option => ({ value: option.value, title: option.title }))
);

const buttonGroupItems = computed<ButtonGroupItem[]>(() =>
  concat<ButtonGroupItem>(
    {
      type: ButtonGroupTypes.Button,
      active: selected.value === FILTER_UNSET_VALUE,
      props: { label: unsetLabel.value },
      handler: () => write(RequestFilterOperator.EQUAL, undefined)
    },
    map(options.value, option => ({
      type: ButtonGroupTypes.Button,
      active: selected.value === option.value,
      props: { label: option.title },
      handler: () => write(RequestFilterOperator.EQUAL, option.const)
    }))
  )
);

const stateItems = computed<ToggleGroupItem[]>(() =>
  map(options.value, option => {
    const key = get(stateKeys.value, option.value);
    return { value: option.value, label: key ? translate(key) : option.title };
  })
);

/**
 * The element's own `i18n` object — label · description · placeholder.
 * Resolved here rather than read off `options`: `Form` merges it in from
 * `onMounted` with no reactive trigger, so the first paint misses it and never
 * re-reads. Unmerged, a key resolving to a STRING must be dropped, or it
 * spreads across the props as numbered characters.
 */
const declared = computed(() => {
  const resolved = resolve(get(control.value.uischema, "i18n"));
  return isPlainObject(resolved) ? (resolved as Record<string, unknown>) : {};
});

const fieldProps = computed<FormControlProps>(() => {
  const merged = omit(assign({}, formFieldProps.value, declared.value), [
    FILTER_TREATMENT_OPTION,
    FILTER_STATES_OPTION
  ]) as FormControlProps;

  if (branch.value === FilterBranch.Unsupported)
    return assign(merged, {
      errors: [translate(FILTER_UNSUPPORTED_I18N_KEY)],
      touched: true
    });

  return assign(merged, {
    layout:
      branch.value === FilterBranch.Boolean
        ? FORM_FIELD_LAYOUT.INLINE
        : FORM_FIELD_LAYOUT.STACKED,
    noLabel: isToggleGroup.value || !!merged.noLabel
  });
});

// --- methods

function typesOf(operator: RequestFilterOperator): string[] {
  return castArray(get(operators.value, [operator, "type"], []));
}

function resolve(key?: string): unknown {
  return jsonforms?.i18n?.translate?.(toString(key), toString(key));
}

function translate(key?: string): string {
  return toString(resolve(key) ?? "");
}

function leaf(operator: RequestFilterOperator): unknown {
  return get(control.value.data, operator);
}

/**
 * Sets or clears ONE leaf, merged onto the column's current value so a
 * two-ended range keeps its untouched end, and writes the whole column. Nil and
 * `""` mean unset: the leaf is removed rather than written empty.
 */
function write(operator: RequestFilterOperator, value: unknown): void {
  const column =
    isNil(value) || value === ""
      ? omit(control.value.data, operator)
      : assign({}, control.value.data, { [operator]: value });

  handleChange(control.value.path, column);
}

/**
 * The clear path every single-select treatment shares. Radix's re-press emits
 * `undefined` and `All` emits the unset value; both must short-circuit, since
 * `find` on a nil value matches the first option and would silently set the
 * filter it was asked to clear.
 */
function onPick(value?: string | string[]): void {
  const picked = isArray(value) ? first(value) : value;

  write(
    RequestFilterOperator.EQUAL,
    isNil(picked) || picked === FILTER_UNSET_VALUE
      ? undefined
      : get(find(options.value, { value: picked }), "const")
  );
}

// --- side effects

watch(
  branch,
  next => {
    if (next !== FilterBranch.Unsupported) return;
    console.error("[Filter] no control for this column's declared operators", {
      path: control.value.path,
      operators: keys(operators.value)
    });
  },
  { immediate: true }
);
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("Filter") };
</script>
