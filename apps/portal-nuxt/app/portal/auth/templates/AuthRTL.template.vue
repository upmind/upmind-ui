<template>
  <PortalAuthShell :ground="AUTH_RTL_GROUND_CLASS">
    <header :class="AUTH_HEADER_ROW_CLASS">
      <div :class="[AUTH_ROW_CONTAINER_CLASS, 'h-full']">
        <div :class="AUTH_ROW_ASIDE_CLASS">
          <div :class="AUTH_ROW_ASIDE_TRACK_CLASS">
            <PortalAuthStore />
          </div>
        </div>
        <div :class="AUTH_ROW_MAIN_CLASS">
          <PortalAuthBrand />
        </div>
      </div>
    </header>

    <div :class="AUTH_TWO_COLUMN_CONTAINER_CLASS">
      <aside :class="AUTH_TWO_COLUMN_ASIDE_CLASS" aria-label="Account">
        <div :class="AUTH_TWO_COLUMN_ASIDE_TRACK_CLASS">
          <slot name="summary" />
        </div>
      </aside>

      <div :class="AUTH_TWO_COLUMN_FORM_CLASS">
        <main id="portal-auth-main" :class="AUTH_TWO_COLUMN_MAIN_CLASS">
          <slot name="hero" />
          <slot name="form" />
        </main>
      </div>
    </div>

    <footer :class="AUTH_FOOTER_ROW_CLASS">
      <div :class="AUTH_ROW_CONTAINER_CLASS">
        <div :class="[AUTH_ROW_ASIDE_CLASS, AUTH_FOOTER_TRACK_CLASS]">
          <div :class="AUTH_ROW_ASIDE_TRACK_CLASS">
            <PortalAuthUpmind />
          </div>
        </div>
        <div :class="[AUTH_ROW_MAIN_CLASS, AUTH_FOOTER_TRACK_CLASS]">
          <PortalAuthLegal />
        </div>
      </div>
    </footer>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// Two columns, the aside leading — what main's `SessionRTL.template.vue` draws on the cart's TWO_COLUMN_RTL
// layout, part for part. `useHeader({ border: "none" })` and the matching
// footer take the body's own ground, so the split runs the full height and the
// rows read as the top and bottom of one page. The cart places no markdown
// here, so this template places no note.
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import PortalAuthUpmind from "../PortalAuthUpmind.vue";
import {
  AUTH_RTL_GROUND_CLASS,
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
