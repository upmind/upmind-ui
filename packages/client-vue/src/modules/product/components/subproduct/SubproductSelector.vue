<template>
  <!-- SELECT (single): a compact dropdown of rich rows -->
  <Select
    v-if="isSelectDropdown"
    v-model="selectValue"
    :items="selectOptions"
    :name="subproduct.id"
    :disabled="disabled"
    :aria-invalid="hasErrors || undefined"
    size="lg"
    class="w-full"
  >
    <template #value>
      <span v-if="selectedOption" class="flex min-w-0 items-center gap-2">
        <img
          v-if="selectedOption.image"
          :src="selectedOption.image"
          :alt="selectedOption.title"
          class="size-5 shrink-0 object-contain object-center"
        />
        <span class="truncate">{{ selectedOption.title }}</span>
      </span>
      <span v-else class="text-muted">{{
        t("form.select_option.placeholder")
      }}</span>
    </template>
    <template #item="{ option }">
      <span v-if="option.opt" class="flex w-full items-center gap-2">
        <img
          v-if="option.opt.image"
          :src="option.opt.image"
          :alt="option.opt.title"
          class="size-5 shrink-0 object-contain object-center"
        />
        <span class="min-w-0 flex-1 truncate">{{ option.opt.title }}</span>
        <SubproductPrice
          v-if="option.opt.price"
          :price="option.opt.price"
          :meta="option.opt.meta"
          :term="term"
        />
      </span>
      <template v-else>{{ option.label }}</template>
    </template>
  </Select>

  <!-- SELECT-GROUPED (single): one collapsible OptionTileNested per group -->
  <OptionTileGroup
    v-else-if="isGroupedNested"
    v-model="modelValue"
    mode="single"
    indicator="leading"
    :required="subproduct.meta.required"
    :disabled="disabled"
    :name="subproduct.id"
    :aria-invalid="hasErrors || undefined"
  >
    <OptionTileNested
      v-for="group in groupedOptions"
      :key="group.key"
      :label="group.name"
    >
      <template v-if="group.icon" #leading>
        <img
          :src="group.icon"
          :alt="group.name"
          class="size-5 shrink-0 object-contain object-center"
        />
      </template>

      <SubproductTile
        v-for="opt in group.options"
        :key="opt.id"
        :option="opt"
        :term="term"
        :quantity="quantityFor(opt.id)"
        :processing="processing"
        @update:quantity="doUpdateQuantity(opt.id, $event)"
      />
    </OptionTileNested>
  </OptionTileGroup>

  <!-- RADIO-ROWS / RADIO-GRID / SELECT-multiple: a flat tile group -->
  <OptionTileGroup
    v-else
    v-model="modelValue"
    :mode="mode"
    :layout="tileLayout"
    :min-tile-width="gridMinTileWidth"
    :required="subproduct.meta.required"
    :disabled="disabled"
    :name="subproduct.id"
    :aria-invalid="hasErrors || undefined"
  >
    <SubproductTile
      v-for="opt in optionsWithConfig"
      :key="opt.id"
      :option="opt"
      :term="term"
      :quantity="quantityFor(opt.id)"
      :processing="processing"
      @pointerdown="onTilePointerDown(opt.id)"
      @click="onTileClick"
      @update:quantity="doUpdateQuantity(opt.id, $event)"
    />
  </OptionTileGroup>
</template>

<script lang="ts" setup>
import { computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { OPTION_SELECTOR } from "@upmind-automation/headless";
import { OptionTileGroup, OptionTileNested, Select } from "@upmind/ui";
import SubproductPrice from "./SubproductPrice.vue";
import SubproductTile from "./SubproductTile.vue";
import { map, some, groupBy, first, find, get, isArray } from "lodash-es";
import type { SubproductOption } from "./types";
import type {
  SubproductDetails,
  UseMetaResult
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

// `modelValue` and its update event are declared by defineModel below.
const emit = defineEmits(["update:quantity"]);

const props = defineProps<{
  subproduct: SubproductDetails;
  meta: UseMetaResult;
  quantities?: Record<string, number>;
  errors?: string | string[];
  term?: number;
  disabled?: boolean;
  processing?: boolean;
}>();

const { t } = useI18n();
const { ui } = props.meta.with({ optionGroup: () => props.subproduct });

// --- model -----------------------------------------------------------------
// Coerce to a single string or an array to match the subproduct's cardinality,
// regardless of what the parent stores.
function safeValue(value: unknown): string | string[] {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  const shouldBeSingle = !multiple || (required && !hasMultiple);
  const safeArray = (isArray(value) ? value : [value]) as string[];
  const safeString = (isArray(value) ? first(value) : value) ?? "";
  if (shouldBeSingle) return safeString as string;
  return (safeArray ?? []).filter(Boolean);
}

const modelValue = defineModel<string | string[]>("modelValue", {
  get: value => safeValue(value),
  set: value => safeValue(value)
});

// The dropdown's option list; an unrequired subproduct leads with None.
interface SubproductSelectOption {
  value: string;
  label?: string;
  textValue?: string;
  opt?: SubproductOption;
}
const selectOptions = computed<SubproductSelectOption[]>(() => {
  const options = optionsWithConfig.value.map(opt => ({
    value: opt.id,
    textValue: opt.title,
    opt
  }));
  if (props.subproduct?.meta?.required) return options;
  return [{ value: NONE, label: t("text.none") }, ...options];
});

// --- per-option config -----------------------------------------------------
const optionsWithConfig = computed<SubproductOption[]>(() =>
  map(props.subproduct?.values, option => {
    const { ui: optionUi, data } = props.meta.with({
      optionGroup: () => props.subproduct,
      option: () => option
    });
    return {
      ...option,
      groupLabel: data.optionGroupLabel,
      groupIcon: data.optionGroupIcon,
      image: optionUi.optionSelectorIcons.isVisible
        ? (data.optionImgUrl ?? option.iconUrl)
        : "",
      descriptionIsInline: optionUi.optionItemDescription.isInline,
      descriptionIsTooltip: optionUi.optionItemDescription.isTooltip
    };
  })
);

const hasGroups = computed(() =>
  some(optionsWithConfig.value, opt => !!opt.groupLabel)
);

const groupedOptions = computed(() => {
  const grouped = groupBy(
    optionsWithConfig.value,
    opt => opt.groupLabel || opt.id
  );
  return map(grouped, items => {
    const head = first(items);
    return {
      key: head?.groupLabel || head?.id || "",
      name: head?.groupLabel || head?.name || "",
      icon: head?.image,
      options: items
    };
  });
});

// --- render mode -----------------------------------------------------------
const mode = computed<"single" | "multiple">(() => {
  const { multiple, required } = props.subproduct.meta;
  const hasMultiple = (props.subproduct?.values?.length || 0) > 1;
  const isSingle = !multiple || (required && !hasMultiple);
  if (isSingle) return "single";
  return "multiple";
});

const selector = computed(() => ui.optionSelector.value);
const anyQuantifiable = computed(() =>
  some(optionsWithConfig.value, opt => !!opt.quantifiable)
);

// A dropdown only suits single-select, non-quantifiable groups; a quantity
// stepper inside a select row is awkward, so those fall through to tiles.
const isSelectDropdown = computed(
  () =>
    selector.value === OPTION_SELECTOR.SELECT &&
    mode.value === "single" &&
    !anyQuantifiable.value
);
const isGroupedNested = computed(
  () =>
    selector.value === OPTION_SELECTOR.SELECT_GROUPED &&
    hasGroups.value &&
    mode.value === "single"
);
const isGrid = computed(() => selector.value === OPTION_SELECTOR.RADIO_GRID);

const tileLayout = computed(() => {
  if (isGrid.value) return "grid";
  return "stack";
});

// Old grid used a fixed column count; the new grid auto-fits by min tile width.
// Translate the configured column count to a sensible minimum.
const GRID_MIN_WIDTH: Record<number, string> = {
  1: "100%",
  2: "16rem",
  3: "12rem"
};
const gridColumns = computed(() => {
  const hasMultipleValues = (optionsWithConfig.value?.length || 0) > 1;
  if (isGrid.value && hasMultipleValues)
    return ui.optionSelectorGrid.asNumber ?? 1;
  return 1;
});
const gridMinTileWidth = computed(
  () => GRID_MIN_WIDTH[gridColumns.value] ?? "10rem"
);

// --- select dropdown -------------------------------------------------------
// reka Select disallows an empty value, so an optional "none" row rides a
// sentinel mapped back to "" on the shared model.
const NONE = "__none__";
const selectValue = computed<string>({
  get: () => {
    const value = isArray(modelValue.value)
      ? first(modelValue.value)
      : modelValue.value;
    if (!value) return NONE;
    return value;
  },
  set: value => {
    if (value === NONE) modelValue.value = "";
    else modelValue.value = value;
  }
});

const selectedOption = computed(() => {
  const value = isArray(modelValue.value)
    ? first(modelValue.value)
    : modelValue.value;
  if (!value) return undefined;
  return find(optionsWithConfig.value, ["id", value]);
});

const hasErrors = computed(() => {
  if (isArray(props.errors)) return props.errors.length > 0;
  return !!props.errors;
});

// --- deselect-on-reclick (optional single-select) --------------------------
// reka's RadioGroup swallows a re-click of the selected item, so an optional
// single-select cannot be cleared by clicking it again. Restore the old
// behaviour from the consumer: pointerdown (before reka commits on click)
// records whether the tile was already selected; click then clears it.
const selectedSingle = computed(() => {
  const value = isArray(modelValue.value)
    ? first(modelValue.value)
    : modelValue.value;
  return value ?? "";
});
const canDeselect = computed(
  () => mode.value === "single" && !props.subproduct.meta.required
);
let pendingDeselect = false;

function onTilePointerDown(id: string) {
  pendingDeselect = canDeselect.value && selectedSingle.value === id;
}

function onTileClick() {
  // Clear after the click settles — reka commits the (unchanged) value during
  // the click, so a synchronous clear would be re-selected.
  if (pendingDeselect) nextTick(() => (modelValue.value = ""));
  pendingDeselect = false;
}

// --- methods ---------------------------------------------------------------
function quantityFor(id: string): number {
  return get(props.quantities, id, 0);
}

function doUpdateQuantity(value: string, quantity: number) {
  emit("update:quantity", value, quantity);
}
</script>
