<template>
  <Button
    v-if="isSupported"
    @click="handleShare"
    :icon="copied ? 'check' : 'share'"
    size="lg"
    variant="link"
    :label="copied ? t('product.copied') : t('product.share')"
    class="font-medium"
  />
</template>

<script lang="ts" setup>
// --- external
import { useClipboard } from "@vueuse/core";

// --- components
import { Button } from "@upmind-automation/upmind-ui";

// --- internal
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { copy, copied, isSupported } = useClipboard({ legacy: true });

const handleShare = () => {
  copy(window.location.href);
};
</script>
