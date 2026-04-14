<template>
  <div
    class="flex items-center justify-center"
    :class="props.open ? 'absolute inset-0' : ''"
  >
    <Interstitial
      v-bind="props"
      :modal="meta.useModal"
      :title="t('text.loading_title_md')"
      :text="t('text.almost_there_msg')"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { computed } from "vue";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: false,
  animatedIcon: () => ({
    icon: "loading",
    delay: 250,
    primaryColor: "base-foreground",
    secondaryColor: "secondary",
    size: "4xl"
  })
});
// -----------------------------------------------------------------------------
const { t } = useI18n();
const route = useRoute();
const routeMeta = route.meta;
const meta = computed(() => ({
  useModal: props.modal || !!routeMeta.modal
}));
</script>
