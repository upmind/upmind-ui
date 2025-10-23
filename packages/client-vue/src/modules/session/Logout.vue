<template>
  <Layout>
    <ContentSection v-auto-animate class="flex grow items-center">
      <Interstitial
        v-bind="props"
        :title="t('auth.logged_out_md')"
        :text="t('text.continue_shopping_desc')"
        :actions="[
          {
            ...storefrontRoute,
            variant: 'solid',
            color: 'primary',
            iconAppend: 'arrow-right',
            label: t('action.continue_shopping')
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

// --- internal
import {
  useRoutingEngine,
  useSession,
  ROUTE,
  useBrand
} from "@upmind-automation/headless";

// -- components
import { Interstitial } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
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
  open: true,

  animatedIcon: () => ({
    icon: "keys",
    trigger: "loop",
    primaryColor: "base-foreground",
    secondaryColor: "tertiary",
    size: "4xl"
  })
});
</script>
