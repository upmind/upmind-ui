<template>
  <!--
    context-menu placement: the ui ContextMenu over the very same declared
    actions — never the sole path to any of them (always-visible + overflow
    already cover 100%).
  -->
  <ContextMenu :items="menuItems" size="sm">
    <template #trigger>
      <div :class="styles.actionSlots.root">
        <!-- always-visible: the actions the scenario placed here, drawn as it
             declared them. Beside a row the icon carries the control and the
             declared label becomes its tooltip and its accessible name. -->
        <Tooltip
          v-for="action in visibleActions"
          :key="`always-${action.name}`"
          :label="action.label"
          :active="!!iconOnly"
        >
          <Button
            size="sm"
            :variant="action.variant ?? 'outline'"
            :color="action.color"
            :icon="action.icon"
            :label="action.label"
            :icon-only="iconOnly"
            :aria-label="action.label"
            :disabled="action.disabled"
            @click="action.onSelect"
          />
        </Tooltip>

        <!-- overflow: everything the scenario did NOT place beside the row -->
        <DropdownMenu
          v-if="overflowItems.length"
          :items="overflowItems"
          size="sm"
          width="md"
        >
          <template #trigger>
            <Button
              size="sm"
              variant="outline"
              icon="dots-vertical"
              icon-only
              :label="t('action.show_more_options')"
              :aria-label="t('action.show_more_options')"
            />
          </template>
        </DropdownMenu>
      </div>
    </template>
  </ContextMenu>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ActionSlots
 * @description Draws each action WHERE its scenario placed it — beside the row
 * or behind the overflow trigger, never both (C10). Dumb trigger fan-out only,
 * no business logic and no opinion about which action belongs where.
 *
 * The context-menu is the one deliberate duplicate: it carries every action so
 * a right-click always reaches all of them, and it is never the sole path to
 * any (the two declared placements together already are).
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Button,
  ContextMenu,
  DropdownMenu,
  Tooltip,
  useStyles
} from "@upmind-automation/upmind-ui";
import { ActionPlacementTypes } from "../scenario.types";
import config from "./ActionSlots.styles";
import { filter, map, reject } from "lodash-es";
import type { ActionSlotItem, ActionSlotsProps } from "./ActionSlots.types";
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<ActionSlotsProps>();

const { t } = useI18n();

const visibleActions = computed(() =>
  filter(props.actions, { placement: ActionPlacementTypes.VISIBLE })
);

/** One declared action as a menu entry — the icon rides it into every menu. */
function menuItem(action: ActionSlotItem): DropdownMenuItemProps {
  return {
    label: action.label,
    value: action.name,
    icon: action.icon,
    disabled: action.disabled,
    handler: action.onSelect
  };
}

// Anything not placed beside the row falls here — including an action whose
// declaration named no placement at all.
const overflowItems = computed<DropdownMenuItemProps[]>(() =>
  map(
    reject(props.actions, { placement: ActionPlacementTypes.VISIBLE }),
    menuItem
  )
);

const menuItems = computed<DropdownMenuItemProps[]>(() =>
  map(props.actions, menuItem)
);

const meta = computed(() => ({ count: props.actions.length }));
const styles = useStyles(["actionSlots"], meta, config);
</script>
