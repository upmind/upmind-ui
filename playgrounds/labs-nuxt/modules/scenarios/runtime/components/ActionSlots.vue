<template>
  <!--
    context-menu placement: the ui ContextMenu over the very same declared
    actions — never the sole path to any of them (always-visible + overflow
    already cover 100%).
  -->
  <ContextMenu :items="menuItems" size="sm">
    <template #trigger>
      <div :class="actionSlots.root({ stretch: stretch })">
        <!-- always-visible: the actions the scenario placed here, drawn as it
             declared them. Beside a row the icon carries the control and the
             declared label becomes its tooltip and its accessible name. -->
        <Tooltip
          v-for="action in visibleActions"
          :key="`always-${action.name}`"
          :label="locked ? t('labs.replay_locked') : action.label"
          :active="!!iconOnly || !!locked"
        >
          <ButtonItems
            size="sm"
            :variant="action.variant ?? 'outline'"
            :icon="action.icon"
            :label="action.label"
            :block="stretch"
            :icon-only="iconOnly"
            :disabled="action.disabled"
            :loading="action.loading"
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
          <!-- No tooltip here: the ui DropdownMenu binds its trigger to the
               FIRST element of this slot, and a Tooltip in between would take
               that binding and leave the menu unopenable. So the trigger says
               why it is refused in its own `title`, the way the pagination
               region does — a trigger that still opens a menu of dead controls
               is the lock leaking (`R6-23`). -->
          <template #trigger>
            <ButtonItems
              size="sm"
              variant="outline"
              icon="dots-vertical"
              icon-only
              :label="t('action.show_more_options')"
              :disabled="locked"
              :title="locked ? t('labs.replay_locked') : undefined"
            />
          </template>
          <template #item="{ item }">
            <span :data-test-value="item.dataAttrs?.['data-test-value']">
              {{ item.label }}
            </span>
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
 *
 * While a scenario drives the surface every control here is locked (`R6-23`),
 * and the tooltip says WHY rather than repeating the label of a control that
 * will not fire — a refusal nobody can explain reads as a broken button.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ContextMenu, DropdownMenu, Tooltip } from "@upmind/ui";
import ButtonItems from "./ButtonItems.vue";
import { ActionPlacementTypes } from "../scenario.types";
import { actionSlots } from "./ActionSlots.styles";
import { filter, kebabCase, map, reject } from "lodash-es";
import type { ActionSlotItem, ActionSlotsProps } from "./ActionSlots.types";
import type { MenuItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

const props = defineProps<ActionSlotsProps>();

const { t } = useI18n();

const visibleActions = computed(() =>
  filter(props.actions, { placement: ActionPlacementTypes.VISIBLE })
);

/**
 * One declared action as a menu entry — the icon rides it into every menu. A
 * menu item has no spinner of its own, so an action in flight holds its entry
 * closed rather than inviting a second click the seam would drop.
 */
function menuItem(action: ActionSlotItem): MenuItem {
  return {
    label: action.label,
    value: action.name,
    disabled: action.disabled || action.loading,
    dataAttrs: { "data-test-value": kebabCase(action.label) },
    onSelect: action.onSelect
  };
}

// Anything not placed beside the row falls here — including an action whose
// declaration named no placement at all.
const overflowItems = computed<MenuItem[]>(() =>
  map(
    reject(props.actions, { placement: ActionPlacementTypes.VISIBLE }),
    menuItem
  )
);

const menuItems = computed<MenuItem[]>(() => map(props.actions, menuItem));

const stretch = computed(() => !!props.stretch);
</script>
