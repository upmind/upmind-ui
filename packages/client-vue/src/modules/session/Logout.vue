<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :title="t('session.end.title')"
        :text="t('session.end.text')"
        :actions="[
          {
            ...storefrontRoute,
            color: 'primary',
            iconAppend: 'arrow-right',
            label: t('session.end.actions.continue')
          }
        ]"
      >
        <template #title>
          <SmartTitle i18n-key="session.end.title" align="center" />
        </template>
      </Interstitial>
    </ContentSection>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useRouter } from "vue-router";

// --- internal
import {
  useRoutingEngine,
  useSession,
  ROUTE,
  useBrand
} from "@upmind-automation/headless";

// -- components
import { Interstitial, Layout } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { isResolved } = useRoutingEngine();
const { logout } = useSession();
const { storefrontRoute } = useBrand();

// if we are not logged out, we should log out
await isResolved(ROUTE.SESSION_END).catch(() => {
  logout();
});

const props = withDefaults(defineProps<InterstitialProps>(), {
  modal: true,
  skrim: "light",
  open: true,
  to: "#vue-app",

  animatedIcon: () => ({
    icon: "keys",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl"
  })
});
</script>
