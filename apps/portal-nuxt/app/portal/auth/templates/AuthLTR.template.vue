<template>
  <PortalAuthShell :ground="AUTH_LTR_GROUND_CLASS">
    <div :class="AUTH_TWO_COLUMN_CONTAINER_CLASS">
      <div :class="AUTH_TWO_COLUMN_FORM_CLASS">
        <header :class="AUTH_TWO_COLUMN_ROW_CLASS">
          <PortalAuthBrand />
        </header>

        <main id="portal-auth-main" :class="AUTH_TWO_COLUMN_MAIN_CLASS">
          <slot name="hero" />
          <slot name="form" />
        </main>

        <footer :class="AUTH_TWO_COLUMN_FOOT_CLASS">
          <PortalAuthLegal />
        </footer>
      </div>

      <aside :class="AUTH_TWO_COLUMN_ASIDE_CLASS" aria-label="Account">
        <div :class="[AUTH_TWO_COLUMN_ROW_CLASS, 'justify-end']">
          <PortalAuthStore />
        </div>

        <slot name="summary" />

        <div :class="[AUTH_TWO_COLUMN_FOOT_CLASS, 'justify-end']">
          <PortalAuthUpmind />
        </div>
      </aside>
    </div>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// Two columns, the form leading — what develop's `SessionLTR.template.vue` draws on the cart's
// TWO_COLUMN_LTR layout, part for part. The header and footer carry the same ground
// as the body and no border, so the split runs the full height; the wordmark
// and the brand's line sit in the form column, the store shortcut and the
// platform's line in the aside. The cart places no markdown here, so this
// template places no note.
import PortalAuthBrand from "../PortalAuthBrand.vue";
import PortalAuthLegal from "../PortalAuthLegal.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import PortalAuthStore from "../PortalAuthStore.vue";
import PortalAuthUpmind from "../PortalAuthUpmind.vue";
import {
  AUTH_LTR_GROUND_CLASS,
  AUTH_TWO_COLUMN_ASIDE_CLASS,
  AUTH_TWO_COLUMN_CONTAINER_CLASS,
  AUTH_TWO_COLUMN_FOOT_CLASS,
  AUTH_TWO_COLUMN_FORM_CLASS,
  AUTH_TWO_COLUMN_MAIN_CLASS,
  AUTH_TWO_COLUMN_ROW_CLASS
} from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
