<template>
  <p class="text-muted whitespace-nowrap text-sm">
    {{
      t("text.copyright", {
        year: new Date().getFullYear(),
        name
      })
    }}
  </p>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBrand } from "@upmind-automation/headless";

const { t } = useI18n();
const { name } = useBrand();
</script>
