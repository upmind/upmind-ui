<template>
  <AuthShell variant="offset" reverse skip-label="Skip to content">
    <template #header>
      <PortalAuthBrand />
      <slot name="back" />
      <PortalAuthStore />
    </template>

    <slot name="hero" />
    <slot name="form" />

    <template #brand>
      <slot name="summary" />
    </template>

    <template #footer>
      <PortalAuthLegal />
      <PortalUpmind v-if="hasUpmindBranding" />
      <slot name="actions" />
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
import { AuthShell } from "@upmind/ui";
import { useBrand } from "@upmind-automation/headless";
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import PortalUpmind from "~/portal/shell/PortalUpmind.vue";

defineOptions({ inheritAttrs: false });

const { hasUpmindBranding } = useBrand();
</script>
