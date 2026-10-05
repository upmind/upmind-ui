<template>
  <!-- Create Account — a centred single card with the shared chrome + Back and
       no summary aside (matches the auth step of the route-based flow). -->
  <InsetLayout centered :aside="false">
    <template #back>
      <slot name="back" />
    </template>

    <template #content>
      <slot name="form" />
    </template>
  </InsetLayout>
</template>

<script lang="ts" setup>
// --- external
import { useConfig } from "@upmind-automation/headless";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { useHeader } from "../../../components/header/useHeader";
import { onMounted } from "vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "@upmind-automation/foundation";
import { InsetLayout } from "@upmind-automation/foundation";

// --- components

// --- types
import type { AuthRoutes } from "@upmind-automation/auth";

// -----------------------------------------------------------------------------

defineProps<AuthRoutes>();

const { ui } = useConfig();

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at setup
// (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });

// The centred auth card stands alone — no footer, unlike the other steps on
// this layout. Runs after the layout's own footer config (child mounts first),
// so this wins.
onMounted(() => {
  // Every step on this layout shares the same minimal chrome: a canvas header aligned to
  // the end (logo + Login/avatar) and a flat canvas footer.
  useHeader({
    background: HEADER_BACKGROUND.CANVAS,
    border: "none",
    items: "end",
    noBasket: ui.basketAction.isHidden
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.CANVAS,
    items: "end",
    justifyRight: "start"
  });

  useFooter({ visible: false });
});
</script>
