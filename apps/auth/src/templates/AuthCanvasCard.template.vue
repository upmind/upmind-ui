<template>
  <AuthShell :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" />
    </template>

    <slot name="hero" />
    <slot name="markdown" />

    <Card>
      <slot
        name="form"
        :active="false"
        :guest-spacing="GUEST_CHECKOUT_SPACING.BELOW"
      />
    </Card>

    <slot name="summary" />

    <template #footer>
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script lang="ts" setup>
import { AuthShell, Card } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { GUEST_CHECKOUT_SPACING } from "@upmind-automation/auth";

defineOptions({ inheritAttrs: false });

const { t } = useI18n();
</script>
