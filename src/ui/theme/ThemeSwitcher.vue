<template>
  <DropdownMenu
    v-if="hasThemes"
    :label="`${activeThemeName} Theme`"
    icon="palette"
    :items="themes"
  />

  <!-- End Popover -->
</template>

<script lang="ts" setup>
import { inject, computed } from "vue";
import { DropdownMenu } from "../dropdown-menu";
import { startCase, keys } from "lodash-es";

const { activeTheme, themes } = inject("uiConfig");

const hasThemes = computed(() => keys(themes.value).length > 1);
const activeThemeName = computed(() => startCase(activeTheme.value || "light"));
</script>
