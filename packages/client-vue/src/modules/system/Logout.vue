<template>
  <article>
    <ContentSection v-auto-animate>
      <Interstitial
        v-bind="props"
        :title="t('session.logged_out.title')"
        :text="t('session.logged_out.text')"
        :actions="[
          {
            as: 'a',
            color: 'primary',
            href: storefrontUrl,
            appendIcon: {
              icon: 'arrow-right',
              size: '2xs',
            },
            label: t('session.logged_out.actions.continue'),
          },
        ]"
      >
        <template #title>
          <SmartTitle i18n-key="session.logged_out.title" />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
const { t } = useI18n();

const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  skrim: "light",

  animatedIcon: () => ({
    icon: "internet",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl",
  }),
});
</script>
