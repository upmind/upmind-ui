<template>
  <AuthShell variant="offset" :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />
    <slot name="form" />

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
// The mirror of the LTR page: the narrow aside leads and the wide form column
// follows, which is the default track order of the shell's offset pair.
import { AuthShell } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
