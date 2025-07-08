<template>
  <article class="flex flex-grow">
    <ContentSection v-auto-animate class="flex flex-grow items-center">
      <Interstitial
        v-bind="props"
        :modal="meta.useModal"
        :text="t('basket.empty.text')"
        :actions="[
          {
            as: 'a',
            color: 'secondary',
            href: storefrontUrl,
            appendIcon: {
              icon: 'arrow-right',
              size: '2xs'
            },
            label: t('basket.empty.actions.continue')
          }
        ]"
      >
        <template #title>
          <SmartTitle i18n-key="basket.empty.title" align="center" />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useRoute } from "vue-router";
import { computed } from "vue";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
import { useBrand } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------
const { t } = useI18n();
const { storefrontUrl } = useBrand();
const route = useRoute();
const routeMeta = route.meta;

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

const meta = computed(() => ({
  useModal: routeMeta.modal !== false
}));
</script>
