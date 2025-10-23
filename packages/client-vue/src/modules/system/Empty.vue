<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :modal="meta.useModal"
        :title="t('cart.empty_md')"
        :text="t('cart.empty_msg')"
        :actions="[
          {
            ...storefrontRoute,
            variant: 'solid',
            color: 'primary',
            iconAppend: 'arrow-right',
            label: t('action.continue_shopping'),
            size: 'lg'
          }
        ]"
      >
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { ROUTE, useBrand, useFeedback } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  animatedIcon: () => ({
    icon: "basket-empty",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl"
  })
});
// -----------------------------------------------------------------------------
const { t } = useI18n();
const { storefrontRoute } = useBrand();
const route = useRoute();
const routeMeta = route.meta;

const meta = computed(() => ({
  useModal: routeMeta.modal !== false
}));
</script>
