<template>
  <AuthShell :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />

    <Card>
      <slot name="markdown" />
      <slot name="form" />
    </Card>

    <slot name="summary" />

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
// The cart's surface-box page is one centred box on the canvas, holding the
// marketing copy and the form together. The centred arrangement draws that
// column, and the canvas tone is the one the shell says brings a card.
import { AuthShell, Card } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
