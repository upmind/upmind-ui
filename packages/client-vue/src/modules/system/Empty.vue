<template>
  <article>
    <ContentSection v-auto-animate>
      <Interstitial
        v-bind="props"
        :modal="meta.useModal"
        :text="t('basket.empty.text')"
        :actions="[
          {
            as: 'a',
            color: 'primary',
            href: storefrontUrl,
            appendIcon: {
              icon: 'arrow-right',
              size: '2xs',
            },
            label: t('basket.empty.actions.continue'),
          },
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

// --- internal
import BasketEmpty from "../../assets/animations/basket-empty.json?url";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
const { t } = useI18n();

const route = useRoute();
const routeMeta = route.meta;

const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  skrim: "light",

  animatedIcon: () => ({
    icon: BasketEmpty,
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl",
  }),
});

const meta = computed(() => ({
  useModal: routeMeta.modal !== false,
}));
</script>
