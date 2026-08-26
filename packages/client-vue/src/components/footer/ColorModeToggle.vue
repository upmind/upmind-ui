<template>
  <Button
    variant="control"
    size="md"
    icon-only
    type="button"
    :aria-label="t('action.toggle_appearance')"
    :data-attrs="{ 'data-test-key': 'color-mode-toggle' }"
    :aria-pressed="isDark"
    class="rounded-field shadow-field"
    @click="toggle"
  >
    <Icon :icon="icon" />
  </Button>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module components/footer/ColorModeToggle
 * @description The persistent dark-mode toggle (FE-2888 Phase 5 / ADR-024 D-4).
 * Flips `useColorMode` — defaults to the brand/OS preference (followed live) and
 * the user's choice persists as an override. Shows the glyph it switches to.
 */
import { Button } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useColorMode } from "../../modules/theming";
import { Icon } from "../icon";

const { isDark, toggle } = useColorMode();
const { t } = useI18n();

const icon = computed<string>(() => {
  if (isDark.value) return "sun";
  return "moon";
});
</script>
