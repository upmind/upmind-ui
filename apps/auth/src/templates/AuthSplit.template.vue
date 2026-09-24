<template>
  <AuthShell variant="split" :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />
    <slot name="markdown" />
    <slot name="form" />

    <template #brand>
      <slot name="summary" />
    </template>

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
import { AuthShell } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
