<template>
  <FormField v-bind="fieldProps">
    <template v-if="meta.isSwitch" #field>
      <div
        class="flex w-full flex-row flex-nowrap items-center justify-between gap-x-3"
      >
        <FormLabel v-if="fieldProps.label" :formItemId="fieldProps.id">
          <span class="inline-flex items-center gap-x-2">
            <span>{{ fieldProps.label }}</span>
          </span>
        </FormLabel>

        <div
          class="control-radius bg-control-surface shadow-control-default inline-flex flex-row flex-nowrap items-center gap-x-2 py-1 pr-1 pl-3"
        >
          <Switch
            :id="fieldProps.id"
            :disabled="fieldProps.disabled"
            :checked="leaf(RequestFilterOperator.EQUAL) === true"
            @update:checked="write(RequestFilterOperator.EQUAL, $event)"
          />
          <span class="text-sm">{{ positionLabel }}</span>
          <Tooltip v-if="meta.isSet" :label="unsetLabel">
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
      </div>
    </template>

    <Search
      v-if="meta.isSearch"
      :id="fieldProps.id"
      :results="null"
      :model-value="toString(leaf(RequestFilterOperator.LIKE))"
      :placeholder="fieldProps.placeholder"
      :disabled="fieldProps.disabled"
      @update:model-value="write(RequestFilterOperator.LIKE, $event)"
    >
      <template v-if="meta.isSet" #append>
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
      v-else-if="meta.isSelect"
      class="flex flex-row flex-nowrap items-center gap-x-3"
    >
      <Select
        :id="fieldProps.id"
        :items="selectItems"
        :model-value="toString(leaf(RequestFilterOperator.EQUAL))"
        :placeholder="fieldProps.placeholder"
        :disabled="fieldProps.disabled"
        @update:model-value="onSelect"
      />
      <Tooltip v-if="meta.isSet" :label="unsetLabel">
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
      v-else-if="meta.isRange"
      class="flex flex-row flex-nowrap items-center gap-x-3"
    >
      <Input
        :id="`${fieldProps.id}-from`"
        :type="meta.isNumericRange ? 'number' : 'text'"
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
        :type="meta.isNumericRange ? 'number' : 'text'"
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
  FormField,
  FormLabel,
  Input,
  Search,
  Select,
  Switch,
  Tooltip,
  useUpmindUIRenderer
} from "@upmind-automation/upmind-ui";
import {
  FilterBranch,
  FILTER_UNSET_I18N_KEY,
  FILTER_UNSUPPORTED_I18N_KEY
} from "./FilterRenderer.types";
import {
  assign,
  castArray,
  find,
  get,
  includes,
  intersection,
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
// --- external

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const jsonforms = inject<JsonFormsSubStates>("jsonforms");

const { control, formFieldProps, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

// --- computed

/** The column's DECLARED operator set — the scope resolves to the column, so
 * its `properties` are the operators it allows and nothing else is consulted. */
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
      return FilterBranch.Switch;

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

const meta = computed(() => ({
  isSearch: branch.value === FilterBranch.Search,
  isSwitch: branch.value === FilterBranch.Switch,
  isSelect: branch.value === FilterBranch.Select,
  isRange: branch.value === FilterBranch.Range,
  isUnsupported: branch.value === FilterBranch.Unsupported,
  isNumericRange: !isEmpty(
    intersection(typesOf(RequestFilterOperator.GREATER_THAN_OR_EQUAL), [
      "number",
      "integer"
    ])
  ),
  isSet: !isEmpty(control.value.data)
}));

const unsetLabel = computed(() => translate(FILTER_UNSET_I18N_KEY));

const positionLabel = computed(() =>
  get(
    find(
      options.value,
      option => option.const === leaf(RequestFilterOperator.EQUAL)
    ),
    "title",
    unsetLabel.value
  )
);

const selectItems = computed(() =>
  map(options.value, option => ({ value: option.value, title: option.title }))
);

/**
 * The element's OWN `i18n` object — label · description · placeholder. `Form`
 * merges it into `options`, but only from `onMounted` and without a reactive
 * trigger, so the control's first paint reads `options` before it lands and
 * never re-reads: the placeholder never renders and a `label: null` never
 * suppresses the schema-title fallback. Resolved here off the injected
 * translator instead — no merge, so a flat key that resolves to a STRING must
 * be dropped rather than spread across the props as numbered characters.
 */
const declared = computed(() => {
  const resolved = resolve(get(control.value.uischema, "i18n"));
  return isPlainObject(resolved) ? (resolved as Record<string, unknown>) : {};
});

const fieldProps = computed(() => {
  const merged = assign({}, formFieldProps.value, declared.value);

  return meta.value.isUnsupported
    ? assign(merged, {
        errors: [translate(FILTER_UNSUPPORTED_I18N_KEY)],
        touched: true
      })
    : merged;
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
 * Sets or clears ONE leaf, always MERGED onto the column's current value, and
 * writes the whole column. The merge is what lets a two-ended range keep its
 * untouched end. Nil and `""` mean unset — the leaf is removed rather than
 * written empty, so a cleared filter is absent from the wire and still passes
 * the leaf's own `minLength`.
 */
function write(operator: RequestFilterOperator, value: unknown): void {
  const column =
    isNil(value) || value === ""
      ? omit(control.value.data, operator)
      : assign({}, control.value.data, { [operator]: value });

  handleChange(control.value.path, column);
}

function onSelect(value: string): void {
  write(
    RequestFilterOperator.EQUAL,
    get(find(options.value, { value }), "const")
  );
}

// --- side effects

// A column no branch claims is a DECLARATION mistake, so it must not take the
// form down with it: the visible affordance is `fieldProps`' error, and the
// operator keys a developer needs go here rather than into a user's sentence.
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
