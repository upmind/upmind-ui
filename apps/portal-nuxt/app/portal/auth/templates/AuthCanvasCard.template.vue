<template>
  <PortalAuthShell :ground="AUTH_CANVAS_GROUND_CLASS">
    <div :class="AUTH_ONE_COLUMN_CONTAINER_CLASS">
      <header :class="AUTH_TWO_COLUMN_ROW_CLASS">
        <PortalAuthBrand />
        <PortalAuthStore />
      </header>

      <main id="portal-auth-main" :class="AUTH_TWO_COLUMN_MAIN_CLASS">
        <Card size="lg" :ui="{ content: CANVAS_CARD_BODY_CLASS }">
          <section :class="CANVAS_CARD_HEADER_CLASS">
            <slot name="hero" />
            <PortalAuthNote />
            <slot name="markdown" />
          </section>

          <section>
            <slot name="form" />
          </section>
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
// One wide card on the canvas — what develop's
// `SessionCanvasCard.template.vue` draws on the cart's CANVAS_CARD layout in
// centred mode: the hero and the copy beside the form at `lg`, stacked below.
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
  CANVAS_CARD_BODY_CLASS,
  CANVAS_CARD_HEADER_CLASS
} from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
