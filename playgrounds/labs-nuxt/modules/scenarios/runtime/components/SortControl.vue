<template>
  <ButtonGroup :items="groupItems" size="sm" data-test-key="sort" />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SortControl
 * @description The display row's sort control — the SAME sort the table headers
 * write, offered in BOTH views (`G3`/`E9`): ordering belongs to the data
 * surface, so the control sits with the data in table view too, beside the view
 * toggle, and is not withheld until the headers happen to be gone. It owns no
 * state: the live sort model comes in and every change goes back out whole, so
 * both affordances funnel through the surface's one emit and can never disagree
 * (`P1-R9`).
 *
 * Drawn the way the house draws a sort control (`client-vue`'s `ProductSort` /
 * `EmailHistorySort`): ONE `ButtonGroup` carrying the direction toggle and the
 * field `Select`. Both of those are bound to their own module's hardcoded
 * sortable-property enum, so the treatment is adopted and the fields stay the
 * caller's declaration. It is drawn at the row's scale — one tight group at the
 * density of the view toggle beside it, never a control that sets the row's
 * height (`R6-1`).
 *
 * The direction vocabulary is the harness's `SORT_DIRECTION`, not headless's
 * same-named enum: everything this control reads and writes is the channel's
 * `TableModel`, whose `dir` is structural by design so it stays assignable
 * across the seam. Headless's is NOMINAL — mixing the two here would only be
 * reconcilable with a cast.
 */

import { computed } from "vue";
import { useFormI18n } from "@upmind-automation/client-vue";
import { SORT_DIRECTION } from "@upmind-automation/scenario-harness";
import {
  ButtonGroup,
  ButtonGroupTypes,
  useStyles
} from "@upmind-automation/upmind-ui";
import config from "./SortControl.styles";
import { find, first } from "lodash-es";
import type { SortControlProps } from "./SortControl.types";
import type {
  SortDirection,
  TableModel
} from "@upmind-automation/scenario-harness";
import type {
  ButtonGroupItem,
  ButtonProps,
  SelectProps
} from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<SortControlProps>();

const emit = defineEmits<{ "update:sort": [sort: TableModel["sort"]] }>();

const i18n = useFormI18n();

const styles = useStyles(["sortControl"], {}, config);

// The PRIMARY key is what the control steers: a multi-key boot order (the
// module's own declared default) shows its leading field, and the user's pick
// replaces the whole model with the single entry they chose.
const active = computed(() => first(props.sort));

const direction = computed(() => active.value?.dir ?? SORT_DIRECTION.ASC);

const isAscending = computed(() => direction.value === SORT_DIRECTION.ASC);

const directionKey = computed(() =>
  isAscending.value ? "action.sort_ascending" : "action.sort_descending"
);

const selected = computed(() =>
  find(props.fields, { value: active.value?.field })
);

const groupItems = computed<ButtonGroupItem[]>(() => [
  {
    type: ButtonGroupTypes.Button,
    props: {
      icon: isAscending.value ? "arrow-up" : "arrow-down",
      iconOnly: true,
      label: i18n.value.translate(directionKey.value, directionKey.value),
      disabled: !active.value || !!props.disabled
    } satisfies ButtonProps,
    handler: () =>
      write(
        active.value?.field,
        isAscending.value ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC
      )
  },
  {
    type: ButtonGroupTypes.Select,
    props: {
      modelValue: active.value?.field,
      items: props.fields,
      disabled: props.disabled,
      placeholder:
        selected.value?.label ??
        i18n.value.translate("text.sort_by", "text.sort_by"),
      // `CxOptions` is clsx's own argument list, so the override is handed over
      // as the array the ui component's defaults already are.
      uiConfig: {
        select: { root: [styles.value.sortControl.field], value: [], item: [] }
      }
    } satisfies SelectProps,
    handler: (field: string) => write(field, direction.value)
  }
]);

/** Every pick writes the WHOLE model: one field, one direction. */
function write(field: string | undefined, dir: SortDirection): void {
  if (!field) return;
  emit("update:sort", [{ field, dir }]);
}
</script>
