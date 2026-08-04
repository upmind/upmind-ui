<template>
  <div
    :class="styles.actionSlots.root"
    @contextmenu.prevent="contextMenuOpen = true"
  >
    <!-- always-visible: every action reachable without the overflow or the context-menu -->
    <div :class="styles.actionSlots.alwaysVisible">
      <Button
        v-for="action in actions"
        :key="`always-${action.name}`"
        size="sm"
        variant="outline"
        :label="action.label"
        :disabled="action.disabled"
        @click="action.onSelect"
      />
    </div>

    <!-- overflow: the same actions, batteries-included DropdownMenu -->
    <DropdownMenu
      v-if="actions.length"
      :items="overflowItems"
      variant="ghost"
      icon="dots-vertical"
      icon-only
      size="sm"
      label="More actions"
      :class="styles.actionSlots.overflowTrigger"
    />

    <!--
      context-menu placement: a thin seam on the existing dropdown-menu
      primitives (Task 17 swaps this for the installed shadcn `context-menu`
      once packages/ui lands it) — externally opened on right-click, never
      the sole path to an action (always-visible + overflow already cover 100%).
    -->
    <DropdownMenuRoot v-model:open="contextMenuOpen">
      <DropdownMenuTrigger as-child>
        <span class="sr-only" aria-hidden="true" />
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
 * @module factory/ActionSlots
 * @description Renders every action identically across the always-visible,
 * overflow (`DropdownMenu`) and context-menu placements (design.md FE-2977
 * §Block C) — dumb trigger fan-out only, no business logic. The always-visible
 * and overflow placements alone already reach every action; the context-menu
 * is a redundant, never-required additional placement.
 */

import { computed, ref } from "vue";
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
import config from "./ActionSlots.styles";
import { map } from "lodash-es";
import type { ActionSlotsProps } from "./ActionSlots.types";
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<ActionSlotsProps>();

const contextMenuOpen = ref(false);

const overflowItems = computed<DropdownMenuItemProps[]>(() =>
  map(props.actions, action => ({
    label: action.label,
    value: action.name,
    disabled: action.disabled,
    handler: action.onSelect
  }))
);

const meta = computed(() => ({ count: props.actions.length }));
const styles = useStyles(["actionSlots"], meta, config);
</script>
