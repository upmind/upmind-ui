<template>
  <a
    v-if="hasUpmindBranding"
    :class="PORTAL_FOOTER_LINK_CLASS"
    href="https://upmind.com"
    target="_blank"
    rel="noreferrer"
    >Powered by Upmind</a
  >
</template>

<script setup lang="ts">
// The platform's own line. The cart's footer sets `justifyRight: start`, so it
// sits at the foot of the aside, opposite the brand's.
import { useMockBrandGates } from "~/portal/mock/gates";
import { PORTAL_FOOTER_LINK_CLASS } from "~/portal/shell/variants";

const { hasUpmindBranding } = useMockBrandGates();
</script>
