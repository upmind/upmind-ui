<template>
  <p :class="styles.footer.copyright">
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
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../footer.config";

const styles = useStyles(["footer.copyright"], {}, config);

const { t } = useI18n();
const { name } = useBrand();
</script>
