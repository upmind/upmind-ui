<template>
  <PortalAuthShell :ground="AUTH_LTR_GROUND_CLASS">
    <header :class="AUTH_HEADER_ROW_CLASS">
      <div :class="[AUTH_ROW_CONTAINER_CLASS, 'h-full']">
        <div :class="AUTH_ROW_MAIN_CLASS">
          <PortalAuthBrand />
        </div>
        <div :class="AUTH_ROW_ASIDE_CLASS">
          <div :class="AUTH_ROW_ASIDE_TRACK_CLASS">
            <PortalAuthStore />
          </div>
        </div>
      </div>
    </header>

    <div :class="AUTH_TWO_COLUMN_CONTAINER_CLASS">
      <div :class="AUTH_TWO_COLUMN_FORM_CLASS">
        <main id="portal-auth-main" :class="AUTH_TWO_COLUMN_MAIN_CLASS">
          <slot name="hero" />
          <slot name="form" />
        </main>
      </div>

      <aside :class="AUTH_TWO_COLUMN_ASIDE_CLASS" aria-label="Account">
        <div :class="AUTH_TWO_COLUMN_ASIDE_TRACK_CLASS">
          <slot name="summary" />
        </div>
      </aside>
    </div>

    <footer :class="AUTH_FOOTER_ROW_CLASS">
      <div :class="AUTH_ROW_CONTAINER_CLASS">
        <div :class="[AUTH_ROW_MAIN_CLASS, AUTH_FOOTER_TRACK_CLASS]">
          <PortalAuthLegal />
        </div>
        <div :class="[AUTH_ROW_ASIDE_CLASS, AUTH_FOOTER_TRACK_CLASS]">
          <div :class="AUTH_ROW_ASIDE_TRACK_CLASS">
            <PortalAuthUpmind />
          </div>
        </div>
      </div>
    </footer>
  </PortalAuthShell>
</template>

<script setup lang="ts">
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import PortalAuthUpmind from "../PortalAuthUpmind.vue";
import {
  AUTH_LTR_GROUND_CLASS,
  AUTH_FOOTER_ROW_CLASS,
  AUTH_FOOTER_TRACK_CLASS,
  AUTH_HEADER_ROW_CLASS,
  AUTH_ROW_ASIDE_CLASS,
  AUTH_ROW_ASIDE_TRACK_CLASS,
  AUTH_ROW_CONTAINER_CLASS,
  AUTH_ROW_MAIN_CLASS,
  AUTH_TWO_COLUMN_ASIDE_CLASS,
  AUTH_TWO_COLUMN_ASIDE_TRACK_CLASS,
  AUTH_TWO_COLUMN_CONTAINER_CLASS,
  AUTH_TWO_COLUMN_FORM_CLASS,
  AUTH_TWO_COLUMN_MAIN_CLASS
} from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
