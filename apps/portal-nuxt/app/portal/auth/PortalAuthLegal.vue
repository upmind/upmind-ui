<template>
  <Markdown
    v-if="footerMarkdown"
    tag="div"
    :model-value="footerMarkdown"
    :class="AUTH_FOOTER_PROSE_CLASS"
  />
  <p v-else :class="AUTH_FOOTER_PROSE_CLASS">
    © {{ new Date().getFullYear() }} {{ brandName }}. All rights reserved.
  </p>
</template>

<script setup lang="ts">
// The brand's own line at the foot of the form column — the cart's FLAT footer.
// It prints the brand's authored footer body where there is one and the
// copyright line where there is not, which is the rule `Footer.vue` follows.
// The sentence is `text.copyright` in the cart; this app carries no i18n and
// writes its copy in place, as every other string here does.
import { Markdown } from "@upmind/ui";
import { useMockBrandGates } from "~/portal/mock/gates";
import { AUTH_FOOTER_PROSE_CLASS } from "~/portal/shell/variants";

const { brandName, footerMarkdown } = useMockBrandGates();
</script>
