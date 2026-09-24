<template>
  <NuxtLayout name="logged-out">
    <PortalAuthShell :ground="AUTH_CANVAS_GROUND_CLASS">
      <div :class="AUTH_ONE_COLUMN_CONTAINER_CLASS">
        <header :class="AUTH_TWO_COLUMN_ROW_CLASS">
          <PortalAuthBrand />
          <PortalAuthStore />
        </header>

        <main id="portal-auth-main" :class="AUTH_TWO_COLUMN_MAIN_CLASS">
          <Card :ui="{ content: LOGGED_OUT_CARD_CONTENT_CLASS }">
            <slot />
          </Card>
        </main>

        <footer :class="[AUTH_TWO_COLUMN_FOOT_CLASS, 'justify-between']">
          <PortalAuthLegal />
          <PortalAuthUpmind />
        </footer>
      </div>
    </PortalAuthShell>
  </NuxtLayout>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module layouts/logged-out-page
 * @description The logged-out screens this app draws itself: verification, reset, preferences.
 */
import { Card } from "@upmind/ui";
import PortalAuthBrand from "~/portal/auth/PortalAuthBrand.vue";
import PortalAuthLegal from "~/portal/auth/PortalAuthLegal.vue";
import PortalAuthShell from "~/portal/auth/PortalAuthShell.vue";
import PortalAuthStore from "~/portal/auth/PortalAuthStore.vue";
import PortalAuthUpmind from "~/portal/auth/PortalAuthUpmind.vue";
import {
  AUTH_CANVAS_GROUND_CLASS,
  AUTH_ONE_COLUMN_CONTAINER_CLASS,
  AUTH_TWO_COLUMN_FOOT_CLASS,
  AUTH_TWO_COLUMN_MAIN_CLASS,
  AUTH_TWO_COLUMN_ROW_CLASS,
  LOGGED_OUT_CARD_CONTENT_CLASS
} from "~/portal/shell/variants";
</script>
