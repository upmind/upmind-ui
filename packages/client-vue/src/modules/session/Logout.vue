<template>
  <article class="flex flex-grow">
    <ContentSection v-auto-animate class="flex flex-grow items-center">
      <Interstitial
        v-bind="props"
        :title="t('session.end.title')"
        :text="t('session.end.text')"
        :actions="[
          {
            as: 'a',
            color: 'secondary',
            href: storefrontUrl,
            appendIcon: {
              icon: 'arrow-right',
              size: '2xs'
            },
            label: t('session.end.actions.continue')
          }
        ]"
      >
        <template #title>
          <SmartTitle i18n-key="session.end.title" align="center" />
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
import {
  useRoutingEngine,
  useSession,
  ROUTE
} from "@upmind-automation/headless";

// -- components
import Internet from "../../assets/animations/internet.json?url";
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { isResolved } = useRoutingEngine();
const { logout } = useSession();

// if we are not logged out, we should log out
await isResolved(ROUTE.SESSION_END).catch(() => logout());

const storefrontUrl = import.meta.env.VITE_APP_STOREFRONT;

const props = withDefaults(defineProps<InterstitialProps>(), {
  open: true,
  modal: true,
  skrim: "light",

  animatedIcon: () => ({
    icon: "keys",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl"
  })
});
</script>
