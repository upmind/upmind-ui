<template>
  <Markdown
    v-if="footerMarkdown"
    tag="div"
    :model-value="footerMarkdown"
    :class="PORTAL_FOOTER_PROSE_CLASS"
  />
  <p v-else :class="PORTAL_FOOTER_PROSE_CLASS">
    {{
      t("text.copyright", { year: new Date().getFullYear(), name: brandName })
    }}
  </p>
</template>

<script setup lang="ts">
// The brand's own line at the foot of the form column — the cart's FLAT footer.
// It prints the brand's authored footer body where there is one and the
// copyright line where there is not, which is the rule `Footer.vue` follows.
import { Markdown } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { useMockBrandGates } from "~/portal/mock/gates";
import { PORTAL_FOOTER_PROSE_CLASS } from "~/portal/shell/variants";

const { t } = useI18n();
const { brandName, footerMarkdown } = useMockBrandGates();
</script>
