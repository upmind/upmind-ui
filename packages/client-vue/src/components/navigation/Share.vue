<template>
  <Link v-if="isSupported" @click="handleShare" :size="size" class="font-medium"
    ><Icon :icon="copied ? 'check' : 'share-07'" />
    {{ copied ? t("confirm.copied") : t("action.share") }}</Link
  >
</template>

<script lang="ts" setup>
import { Link } from "@upmind/ui";
import { useClipboard } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { Icon } from "../icon";
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
