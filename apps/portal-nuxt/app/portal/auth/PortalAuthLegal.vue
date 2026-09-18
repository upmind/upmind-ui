<template>
  <Markdown
    v-if="footerMarkdown"
    tag="div"
    :model-value="footerMarkdown"
    :class="PORTAL_FOOTER_PROSE_CLASS"
  />
</template>

<script setup lang="ts">
// The brand's own line at the foot of the form column — the cart's FLAT footer.
import { Markdown } from "@upmind/ui";
import { useMockBrandGates } from "~/portal/mock/gates";
import { PORTAL_FOOTER_PROSE_CLASS } from "~/portal/shell/variants";

const { footerMarkdown } = useMockBrandGates();
</script>
