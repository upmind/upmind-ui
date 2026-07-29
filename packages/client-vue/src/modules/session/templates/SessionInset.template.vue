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
import { onMounted } from "vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "../../../components/section/useSection";

// --- components
import InsetLayout from "../../../components/layout/layouts/Inset.layout.vue";

// --- types
import type { SessionRoutes } from "../types";

// -----------------------------------------------------------------------------

defineProps<SessionRoutes>();

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
  useFooter({ visible: false });
});
</script>
