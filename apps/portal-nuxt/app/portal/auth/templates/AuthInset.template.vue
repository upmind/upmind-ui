<template>
  <AuthShell skip-label="Skip to content">
    <template #header>
      <PortalAuthBrand />
      <slot name="back" />
      <PortalAuthStore />
    </template>

    <Card>
      <slot name="form" />
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
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import { useMockBrandGates } from "~/portal/mock/gates";
import PortalUpmind from "~/portal/shell/PortalUpmind.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });

const { hasUpmindBranding } = useMockBrandGates();
</script>
