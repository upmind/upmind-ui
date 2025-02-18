<template>
  <article>
    <ContentSection>
      <Interstitial
        v-bind="props"
        :title="t('errors.generic.title')"
        :text="t('errors.generic.text')"
        :actions="[
          {
            as: 'a',
            color: 'primary',
            href: storefrontUrl,
            prependIcon: {
              icon: 'arrow-left',
              size: '2xs',
            },
            label: t('errors.generic.action'),
          },
        ]"
        size="3xl"
      >
        <template #title>
          <SmartTitle
            i18n-key="errors.generic.title"
            class="mt-4"
            align="center"
            size="3xl"
          />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
const { t } = useI18n();

// @ts-ignore
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  skrim: "light",

  animatedIcon: () => ({
    icon: "basket-empty",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl",
  }),
});
</script>
