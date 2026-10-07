<template>
  <p :class="footerCopyrightVariants()">
    {{
      t("text.copyright", {
        year: new Date().getFullYear(),
        name
      })
    }}
  </p>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBrand } from "@upmind-automation/headless";
import { footerCopyrightVariants } from "../variants";

const { t } = useI18n();
const { name } = useBrand();
</script>
