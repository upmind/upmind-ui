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
            href: resolvedRoute,
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
import { Interstitial } from "@upmind-automation/upmind-ui";
import SmartTitle from "../../components/content/SmartTitle.vue";
import ContentSection from "../../components/content/ContentSection.vue";

// -- types
import { type InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const router = useRouter();
const { t } = useI18n();
const { isResolved } = useRoutingEngine();
const { logout } = useSession();
const { storefrontUrl, uiCart } = useBrand();

// if we are not logged out, we should log out
await isResolved(ROUTE.SESSION_END).catch(() => logout());

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

const resolvedRoute = uiCart.value?.catalogue?.enabled
  ? router.resolve({ name: ROUTE.CATALOGUE })?.fullPath
  : (storefrontUrl.value ?? "/");
</script>
