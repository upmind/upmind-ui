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
import { Markdown } from "@upmind/ui";
import { useMockBrandGates } from "~/portal/mock/gates";
import { AUTH_FOOTER_PROSE_CLASS } from "~/portal/shell/variants";

const { brandName, footerMarkdown } = useMockBrandGates();
</script>
