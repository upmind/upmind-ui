<template>
  <AuthShell :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />
    <slot name="markdown" />

    <Card>
      <slot name="form" />
    </Card>

    <slot name="summary" />

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
// The same centred column as the enclosed page, with the form lifted onto a
// card. The shell's own note says the canvas-toned arrangements are the ones
// that bring a card.
import { AuthShell, Card } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
