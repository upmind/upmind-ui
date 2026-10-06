<template>
  <AuthShell :skip-label="t('action.skip_to_content')">
    <template #header>
      <slot name="back" :compact="true" />
    </template>

    <Card>
      <slot
        name="form"
        :card="true"
        :guest-spacing="GUEST_CHECKOUT_SPACING.NONE"
      />
    </Card>

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
