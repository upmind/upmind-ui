<template>
  <PortalAuthShell :ground="AUTH_CANVAS_GROUND_CLASS">
    <div :class="AUTH_ONE_COLUMN_CONTAINER_CLASS">
      <header :class="AUTH_TWO_COLUMN_ROW_CLASS">
        <PortalAuthBrand />
        <PortalAuthStore />
      </header>

      <main id="portal-auth-main" :class="AUTH_TWO_COLUMN_MAIN_CLASS">
        <slot name="hero" />
        <Card :ui="{ content: LOGGED_OUT_CARD_CONTENT_CLASS }">
          <PortalAuthNote />
          <slot name="markdown" />
          <slot name="form" />
        </Card>
      </main>

      <footer :class="[AUTH_TWO_COLUMN_FOOT_CLASS, 'justify-between']">
        <PortalAuthLegal />
        <PortalAuthUpmind />
      </footer>
    </div>
  </PortalAuthShell>
</template>

<script setup lang="ts">
import { Card } from "@upmind/ui";
import PortalAuthNote from "../PortalAuthNote.vue";
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import PortalAuthUpmind from "../PortalAuthUpmind.vue";
import {
  AUTH_CANVAS_GROUND_CLASS,
  AUTH_ONE_COLUMN_CONTAINER_CLASS,
  AUTH_TWO_COLUMN_FOOT_CLASS,
  AUTH_TWO_COLUMN_MAIN_CLASS,
  AUTH_TWO_COLUMN_ROW_CLASS,
  LOGGED_OUT_CARD_CONTENT_CLASS
} from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
