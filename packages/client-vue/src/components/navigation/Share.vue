<template>
  <Link
    v-if="isSupported"
    @click="handleShare"
    :icon="copied ? 'check' : 'share-07'"
    :label="copied ? t('confirm.copied') : t('action.share')"
    :size="size"
    class="font-medium"
  />
</template>

<script lang="ts" setup>
import { useClipboard } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { Link } from "@upmind-automation/upmind-ui";
import type { ShareProps } from "./types";

const { t } = useI18n();

withDefaults(defineProps<ShareProps>(), {
  size: "lg"
});

const { copy, copied, isSupported } = useClipboard({ legacy: true });

const handleShare = () => {
  copy(window.location.href);
};
</script>
