<template>
  <Loading
    :active="!meta.isAvailable || !meta.hasSettings"
    class-active="h-full min-h-screen w-full text-base bg-canvas"
    id="vue-app"
  >
    <Suspense
      @pending="setLoading(true)"
      @resolve="setLoading(false)"
      @fallback="setLoading(true)"
    >
      <Page :class="styles.page" v-if="meta.isAvailable && meta.hasSettings">
        <slot name="header">
          <Header />
        </slot>

        <main class="flex w-full flex-col" :class="{ grow: grow }">
          <RouterView v-slot="routerViewProps" :key="$route.fullPath">
            <slot v-bind="routerViewProps">
              <template v-if="routerViewProps.Component">
                <Suspense
                  @pending="setLoading(true)"
                  @resolve="setLoading(false)"
                  @fallback="setLoading(true)"
                >
                  <KeepAlive>
                    <component :is="routerViewProps.Component" />
                  </KeepAlive>

                  <template #fallback>
                    <AsyncLoading
                      v-bind="loadingProps"
                      v-if="meta.isAvailable && meta.hasSettings"
                    />
                  </template>
                </Suspense>
              </template>
            </slot>
          </RouterView>
        </main>

        <slot name="footer">
          <Footer />
        </slot>
      </Page>
    </Suspense>
  </Loading>
  <Feedback v-if="meta.isAvailable" />
</template>

<script lang="ts">
export default {
  name: "Upmind",
  inheritAttrs: false,
  customOptions: {}
};
</script>

<script setup lang="ts">
// --- external
import { computed, nextTick, ref } from "vue";
import { useRoute } from "vue-router";

// --- internal
import useUpmind, { UpmindStatus } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { useTheme } from "./modules/theming";
import { useLayout } from "./components/layout/useLayout";

// --- components
import Header from "./components/header/Header.vue";
import Footer from "./components/footer/Footer.vue";
import Feedback from "./modules/feedback/Feedback.vue";
import Page from "./components/page/Page.vue";
import AsyncLoading from "./modules/system/Loading.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<{
  theme?: string;
  logo?: string;
  loadingProps?: InterstitialProps;
}>();
const loading = ref(true);

// -----------------------------------------------------------------------------

const themeReady = ref(false);

const currentRoute = useRoute();
const { grow } = useLayout();

const meta = computed(() => ({
  isAvailable: useUpmind.status.value == UpmindStatus.initialised,
  isLoading: loading.value,
  hasSettings: themeReady.value
}));

const route = computed(() =>
  get(currentRoute, "name", get(currentRoute, "path", ""))
);

// add any page specific styles here based on route or other state
const styles = useStyles(
  ["page"],
  computed(() => {
    return {
      route: route.value,
      loading: loading.value,
      available: meta.value.isAvailable
    };
  })
) as ComputedRef<{
  page: string;
}>;

/**
 * Set loading state for the app and once loading is complete scroll to any anchor in the URL
 * @param value
 */
function setLoading(value: boolean) {
  loading.value = value;
  if (!value) scrollToAnchor();
}

/**
 * Scroll to any anchor in the URL once the App is loaded and all awaits are complete
 */
function scrollToAnchor() {
  const { hash } = location;
  if (!hash) return;

  const decoded = decodeURIComponent(hash);
  nextTick(() => {
    document.querySelector(decoded)?.scrollIntoView({
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
    .then(() => (themeReady.value = true))
);
</script>
