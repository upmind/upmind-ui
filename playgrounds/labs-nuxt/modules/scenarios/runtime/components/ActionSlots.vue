<template>
  <div
    :class="styles.actionSlots.root"
    @contextmenu.prevent="contextMenuOpen = true"
  >
    <!-- always-visible: the actions the scenario placed here, drawn as it declared them -->
    <div :class="styles.actionSlots.alwaysVisible">
      <Button
        v-for="action in visibleActions"
        :key="`always-${action.name}`"
        size="sm"
        :variant="action.variant ?? 'outline'"
        :color="action.color"
        :icon="action.icon"
        :label="action.label"
        :disabled="action.disabled"
        @click="action.onSelect"
      />
    </div>

    <!-- overflow: everything the scenario did NOT place beside the row -->
    <DropdownMenu v-if="overflowItems.length" :items="overflowItems" size="sm">
      <template #trigger>
        <Button
          size="sm"
          variant="outline"
          icon="dots-vertical"
          icon-only
          :label="t('action.show_more_options')"
          :class="styles.actionSlots.overflowTrigger"
        />
      </template>
    </DropdownMenu>

    <!--
      context-menu placement: a thin seam on the existing dropdown-menu
      primitives — externally opened on right-click, never the sole path to an
      action (always-visible + overflow already cover 100%).
    -->
    <DropdownMenuRoot v-model:open="contextMenuOpen">
      <DropdownMenuTrigger as-child>
        <span aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            v-for="action in actions"
            :key="`context-${action.name}`"
            :disabled="action.disabled"
            @select="action.onSelect"
          >
            {{ action.label }}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  </div>
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

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  useStyles
} from "@upmind-automation/upmind-ui";
import { ActionPlacementTypes } from "../scenario.types";
import config from "./ActionSlots.styles";
import { filter, map, reject } from "lodash-es";
import type { ActionSlotsProps } from "./ActionSlots.types";
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<ActionSlotsProps>();

const { t } = useI18n();

const contextMenuOpen = ref(false);

const visibleActions = computed(() =>
  filter(props.actions, { placement: ActionPlacementTypes.VISIBLE })
);

// Anything not placed beside the row falls here — including an action whose
// declaration named no placement at all.
const overflowItems = computed<DropdownMenuItemProps[]>(() =>
  map(
    reject(props.actions, { placement: ActionPlacementTypes.VISIBLE }),
    action => ({
      label: action.label,
      value: action.name,
      icon: action.icon,
      disabled: action.disabled,
      handler: action.onSelect
    })
  )
);

const meta = computed(() => ({ count: props.actions.length }));
const styles = useStyles(["actionSlots"], meta, config);
</script>
