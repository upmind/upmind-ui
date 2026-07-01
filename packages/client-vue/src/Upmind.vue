<template>
  <Suspense>
    <Loading
      :active="!meta.isAvailable || !meta.hasSettings"
      class-active="h-full min-h-screen w-full text-base bg-canvas"
      id="vue-app"
      :transparent="false"
    >
      <Page v-if="meta.isAvailable && meta.hasSettings">
        <Banner
          v-if="announcementVisible"
          :text="announcement?.text"
          :color="announcement?.type"
          :icon="announcement?.icon"
          @action="announcement?.onAction?.() ?? dismissAnnouncement()"
        />

        <slot name="header">
          <Header :logo="props.logo" :storefront-route="props.storefrontRoute">
            <template #branding>
              <slot name="header-branding" />
            </template>
            <template #actions>
              <slot name="header-actions" />
            </template>
          </Header>
        </slot>

        <AsyncLoading :open="meta.isLoading" v-bind="props.loadingProps" />

        <Main>
          <slot name="sidebar" />
          <slot
            name="default"
            v-bind="{
              meta,
              loadingProps: props.loadingProps,
              resolve: scrollToAnchor
            }"
          >
            <UpmRouteView
              :loading-props="props.loadingProps"
              @resolve="scrollToAnchor"
            />
          </slot>
        </Main>

        <!-- Overlay routes — auth, 2fa, verify-email -->
        <UpmOverlayController />
        <template #footer>
          <slot name="footer">
            <Footer />
          </slot>
        </template>
      </Page>

      <slot name="append" />
      <Feedback v-if="meta.isAvailable" :storefront-route="storefrontRoute" />
    </Loading>
  </Suspense>
</template>

<script lang="ts">
export default {
  name: "Upmind",
  inheritAttrs: false,
  customOptions: {}
};
</script>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import useUpmind, {
  UpmindStatus,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { useThemes } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Banner, Loading } from "@upmind-automation/upmind-ui";
import { useAnnouncement } from "./components/announcement/useAnnouncement";
import Footer from "./components/footer/Footer.vue";
import Header from "./components/header/Header.vue";
import Main from "./components/main/Main.vue";
import UpmOverlayController from "./components/overlays/OverlayController.vue";
import Page from "./components/page/Page.vue";
import Feedback from "./modules/feedback/Feedback.vue";
import AsyncLoading from "./modules/system/Loading.vue";
import UpmRouteView from "./modules/system/RouteView.vue";
import { useTheme } from "./modules/theming";
import { get } from "lodash-es";
import type { StorefrontRoute } from "./types";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<{
  theme?: string;
  logo?: string;
  loadingProps?: InterstitialProps;
  storefrontRoute?: StorefrontRoute;
}>();

// -----------------------------------------------------------------------------
const { set } = useThemes();
const { meta: routingMeta } = useRoutingEngine();
const {
  announcement,
  isVisible: announcementVisible,
  dismiss: dismissAnnouncement
} = useAnnouncement();
const themeReady = ref(false);
const route = useRoute();

/**
 * Meta information about the Upmind app state
 * - isLoading: whether the  initial route is still being resolved
 * - isAvailable: whether Upmind has initialised successfully
 * - hasSettings: whether the theme settings have been loaded
 */
const meta = computed(() => ({
  isLoading: routingMeta.value.isInitialRoute,
  isAvailable: useUpmind.status.value == UpmindStatus.initialised,
  hasSettings: themeReady.value
}));

const { ui } = useConfig();

// add any page specific styles here based on route or other state
const _styles = useStyles(
  ["page"],
  computed(() => {
    return {
      route: get(route, "name", get(route, "path", "")),
      loading: !meta.value.isLoading,
      available: meta.value.isAvailable
    };
  })
);

/**
 * Scroll to any anchor in the URL once the App is loaded and all awaits are complete
 */
function scrollToAnchor() {
  const { hash } = location;
  if (!hash) return;

  // NB: use getElementById — querySelector throws on invalid CSS selectors
  // (e.g. JSON Schema $ref paths like ##/properties/...)
  const id = decodeURIComponent(hash).replace(/^#/, "");
  nextTick(() => {
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      inline: "nearest",
      behavior: "smooth"
    });
  });
}

// --side effects

// wait for upmind and theme to be ready before allowing the app to render and disable loading state
useUpmind.isReady().then(() =>
  useTheme(props.theme)
    .isReady()
    .then(() => set(props.theme ?? ui.theme.value))
    .then(() => (themeReady.value = true))
);
</script>
