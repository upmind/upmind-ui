<template>
  <AuthShell :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <Card>
      <slot name="form" />
    </Card>

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
// The one-page flow's card. It drops the hero and the marketing copy, exactly
// as the cart's inset page does: the card and the back link are the whole page.
import { AuthShell, Card } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
