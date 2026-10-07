<template>
  <AuthShell skip-label="Skip to content">
    <template #header>
      <PortalAuthBrand />
      <slot name="back" :compact="true" />
      <PortalAuthStore />
    </template>

    <Card>
      <slot
        name="form"
        :card="true"
        :guest-spacing="GUEST_CHECKOUT_SPACING.NONE"
      />
    </Card>

    <template #footer>
      <PortalAuthLegal />
      <PortalUpmind v-if="hasUpmindBranding" />
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { AuthShell, Card } from "@upmind/ui";
import { useBrand } from "@upmind-automation/headless";
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import PortalUpmind from "~/portal/shell/PortalUpmind.vue";
import { GUEST_CHECKOUT_SPACING } from "@upmind-automation/auth";

defineOptions({ inheritAttrs: false });

const { hasUpmindBranding } = useBrand();
</script>
