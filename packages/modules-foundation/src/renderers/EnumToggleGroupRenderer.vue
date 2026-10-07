<template>
  <FormField v-bind="formFieldProps">
    <!-- Field height (`lg` = Input's default h-9), and `self-start` so the
         group keeps its intrinsic width inside FormField's stretched column
         instead of spanning the form like a block. -->
    <ToggleGroup
      type="single"
      :model-value="selected"
      :disabled="!control.enabled"
      size="lg"
      class="self-start"
      @update:model-value="onPick"
    >
      <ToggleGroupItem
        v-for="position in positions"
        :key="position.key"
        :value="position.key"
      >
        {{ position.label }}
        <Badge v-if="position.tag" variant="neutral">{{ position.tag }}</Badge>
      </ToggleGroupItem>
    </ToggleGroup>
  </FormField>
</template>

<script lang="ts" setup>
import {
  and,
  isBooleanControl,
  isEnumControl,
  not,
  optionIs,
  or
} from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import {
  Badge,
  FormField,
  ToggleGroup,
  ToggleGroupItem,
  useUpmindUIRenderer
} from "@upmind/ui";
import { computed } from "vue";
import { find, get, isNil, map, reject, toString } from "lodash-es";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/EnumToggleGroupRenderer
 * @description A non-boolean enum as a toggle group, where un-pressing the
 * active position writes the member `options.defaultOptionValue` names —
 * legacy's `URadioSelectorWithDefault`: two pressed positions, and the
 * un-pressed state is "follow the default". That member is a VALID value
 * (it is what the un-pressed state stands for) but draws no position; an
 * option's `text` is drawn as its tag (legacy's "Default"). Without a
 * `defaultOptionValue` the un-press is the clear (`null`), as the boolean
 * sibling `FilterToggleGroupRenderer` does.
 *
 * Radix keys positions and model by string, so the mapping to and from the
 * enum's own typed members is contained here; what the control WRITES is
 * always a member, never a string.
 */

type TaggedOption = EnumOption & { text?: string };

type Position = {
  key: string;
  label: string;
  tag?: string;
};

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, handleChange, touched } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

/** The member the un-pressed state stands for, else `null` — the clear. */
const restValue = computed<unknown>(() =>
  get(appliedOptions.value, "defaultOptionValue", null)
);

/** The enum options, schema-level overrides first, then the control's. */
const options = computed<TaggedOption[]>(() => {
  const { options, schema } = control.value as {
    options: TaggedOption[];
    schema: JsonSchema & { options?: TaggedOption[] };
  };
  return schema.options ?? options ?? [];
});

/**
 * `button-group` draws the rest member as a position of its own (the filter
 * bar's `All │ Yes │ No`); `toggle-group` leaves it to the un-press.
 */
const drawsRest = computed(
  () => get(appliedOptions.value, "format") === "button-group"
);

/**
 * The DRAWN positions. The rest member draws only in `button-group` (the bar's
 * `All │ Yes │ No`), where it is the clear position — including a `null` rest,
 * which `toggle-group` instead leaves to the un-press. Any OTHER nil member has
 * no position to stand for.
 */
const positions = computed<Position[]>(() =>
  map(
    reject(options.value, option =>
      option.value === restValue.value ? !drawsRest.value : isNil(option.value)
    ),
    option => ({
      key: toString(option.value),
      label: option.label,
      tag: option.text
    })
  )
);

const selected = computed(() => {
  const { data } = control.value;
  // `button-group` draws the rest as its own position, so an unset leaf presses
  // it rather than pressing nothing.
  if (drawsRest.value) return toString(isNil(data) ? restValue.value : data);
  if (isNil(data) || data === restValue.value) return undefined;
  return toString(data);
});

// --- methods

/**
 * The pressed position's own member; radix emits `undefined` when the active
 * position is re-pressed, and that is the rest member. `handleChange`, not
 * `onInput`: `onInput` drops a nil as "not dirty" and its default adapter
 * turns a falsy member (`0`) into `null`.
 */
function onPick(value?: unknown): void {
  const picked = find(
    options.value,
    option => toString(option.value) === value
  );
  handleChange(control.value.path, picked ? picked.value : restValue.value);
  touched.value = true;
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(
    isEnumControl,
    not(isBooleanControl),
    or(optionIs("format", "toggle-group"), optionIs("format", "button-group"))
  )
};
</script>
