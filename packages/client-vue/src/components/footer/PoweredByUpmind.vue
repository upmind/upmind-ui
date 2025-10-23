<template>
  <div class="text-muted inline-flex items-center gap-2 text-sm">
    <img
      v-if="upmindLogo"
      :src="upmindLogo"
      alt="Upmind logo"
      width="16"
      height="16"
    />
    <p>
      {{ t("text.powered_by") }}
      <Link
        size="inherit"
        color="inherit"
        href="https://upmind.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block underline underline-offset-2"
        >Upmind</Link
      >
    </p>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBrand } from "@upmind-automation/headless";
import { Link } from "@upmind-automation/upmind-ui";

// --- assets
import upmindLogo from "../../assets/mark.svg";

const { t } = useI18n();
const { name } = useBrand();
</script>
