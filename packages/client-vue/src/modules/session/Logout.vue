<template>
  <article v-if="visible">
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
          <SmartTitle i18n-key="session.logged_out.title" align="center" />
        </template>
      </Interstitial>
    </ContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useRoutingEngine, ROUTE } from "@upmind-automation/headless-vue";

// -- components
import Internet from "../../assets/animations/internet.json?url";
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { back, isResolved } = useRoutingEngine();

const visible = ref(false);
visible.value = await isResolved(ROUTE.SESSION_END)
  .then(() => true)
  .catch(() => {
    back();
    return false;
  });
const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  skrim: "light",

  animatedIcon: () => ({
    icon: Internet,
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl",
  }),
});
</script>
