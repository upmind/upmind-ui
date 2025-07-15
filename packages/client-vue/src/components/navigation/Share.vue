<template>
  <span v-if="isSupported" class="flex items-center gap-x-2">
    <Icon :icon="copied ? 'check' : 'share'" size="xs" />
    <Link @click="handleShare">
      {{ copied ? t("product.copied") : t("product.share") }}
    </Link>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { useClipboard } from "@vueuse/core";

// --- components
import { Link, Icon } from "@upmind-automation/upmind-ui";

// --- internal
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { copy, copied, isSupported } = useClipboard({ legacy: true });

const handleShare = () => {
  copy(window.location.href);
};
</script>
