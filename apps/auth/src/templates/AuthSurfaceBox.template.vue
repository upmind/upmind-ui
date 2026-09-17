<template>
  <AuthShell variant="triptych" :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />
    <slot name="form" />

    <template #brand>
      <slot name="markdown" />
    </template>

    <template #secondary>
      <slot name="summary" />
    </template>

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
// The cart's surface-box page sets the form on a toned box between two rails.
// The shell's triptych is that arrangement: a brand rail, the form, and a muted
// second rail the summary sits in.
import { AuthShell } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
