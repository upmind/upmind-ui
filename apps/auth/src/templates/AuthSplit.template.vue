<template>
  <AuthShell variant="offset" :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />

    <Card>
      <slot name="form" />
    </Card>

    <template #brand>
      <slot name="markdown" />
      <slot name="summary" />
    </template>

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
// The cart's split page hides its header and footer and gives the marketing
// copy its own half. `offset` is the shell's asymmetric two-pane arrangement,
// and it is canvas-toned, so the form takes a card.
import { AuthShell, Card } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
