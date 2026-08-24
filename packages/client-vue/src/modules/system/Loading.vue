<template>
  <div
    class="flex items-center justify-center"
    :class="props.open ? 'absolute inset-0' : ''"
  >
    <Interstitial
      v-bind="props"
      :close-label="props.closeLabel ?? t('action.close')"
      :modal="meta.useModal"
      :title="t('text.loading_title_md')"
      :text="t('text.almost_there_msg')"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Interstitial } from "@upmind/ui";
import { useFooter } from "../../components/footer/useFooter";
import { useHeader } from "../../components/header/useHeader";
import { useLayout } from "../../components/layout/useLayout";
import type { LoadingProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<LoadingProps>(), {
  open: true,
  modal: false,
  animatedIcon: () => ({
    icon: "loading",
    delay: 250,
    size: "xl"
  })
});

// Reset shell to defaults when loading state shows (skip for modals)
if (!props.modal) {
  useHeader({});
  useFooter({});
  useLayout({});
}
// -----------------------------------------------------------------------------
const { t } = useI18n();
const route = useRoute();
const routeMeta = route.meta;
const meta = computed(() => ({
  useModal: props.modal || !!routeMeta.modal
}));
</script>
