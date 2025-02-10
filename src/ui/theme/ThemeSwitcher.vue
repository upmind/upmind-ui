<template>
  <DropdownMenu
    v-if="hasThemes"
    :label="`${activeThemeName} Theme`"
    icon="palette"
    :items="items"
  />

  <!-- End Popover -->
</template>

<script lang="ts" setup>
import { inject, computed } from "vue";
import { DropdownMenu } from "../dropdown-menu";
import { startCase, keys, map } from "lodash-es";
import type { useThemes } from "../../utils";
import type { DropdownMenuItemProps } from "../dropdown-menu";

const { activeTheme, themes } = inject("uiConfig") as ReturnType<
  typeof useThemes
>;

const hasThemes = computed(() => keys(themes.value).length > 1);
const activeThemeName = computed(() => startCase(activeTheme.value || "light"));

const items = computed<DropdownMenuItemProps[]>(() =>
  map(themes.value, theme => ({
    label: theme.label,
    value: theme.value,
    handler: theme.handler,
  }))
);
</script>
