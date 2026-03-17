<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      v-bind="props"
      :open="isOpen"
      :modal="true"
      :title="t('error.chunk_error_title_md')"
      :text="t('error.chunk_error_text')"
      :actions="[
        {
          variant: 'solid',
          color: 'primary',
          icon: 'refresh-cw-01',
          label: t('action.reload_page'),
          size: 'lg',
          handler: reload
        }
      ]"
      data-testid="asset-unavailable"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -- composables
import { useAssetRecovery } from "./useAssetRecovery";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: false,
  modal: true,
  animatedIcon: () => ({
    icon: "unavailable",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl"
  })
});

const { t } = useI18n();
const { isOpen, reload } = useAssetRecovery();
</script>
