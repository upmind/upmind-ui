<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :modal="meta.useModal"
        :text="t('basket.empty.text')"
        :actions="[
          {
            is: 'a',
            color: 'primary',
            href: storefrontUrl,
            iconAppend: 'arrow-right',
            label: t('basket.empty.actions.continue'),
            size: 'lg'
          }
        ]"
      >
        <template #title>
          <SmartTitle i18n-key="basket.empty.title" align="center" />
        </template>
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
import { Interstitial, Layout } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { ROUTE, useBrand } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  skrim: "light",

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
const router = useRouter();
const { storefrontUrl } = useBrand();
const route = useRoute();
const routeMeta = route.meta;

const meta = computed(() => ({
  useModal: routeMeta.modal !== false
}));
</script>
