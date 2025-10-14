<template>
  <Link
    v-if="isSupported"
    @click="handleShare"
    :icon="copied ? 'check' : 'share'"
    :label="copied ? t('confirm.copied') : t('action.share')"
  />
</template>

<script lang="ts" setup>
// --- external
import { useClipboard } from "@vueuse/core";

// --- components
import { Link } from "@upmind-automation/upmind-ui";

// --- internal
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { copy, copied, isSupported } = useClipboard({ legacy: true });

const handleShare = () => {
  copy(window.location.href);
};
</script>
