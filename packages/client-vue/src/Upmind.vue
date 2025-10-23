<template>
  <Loading
    :active="!meta.isAvailable || !meta.hasSettings"
    class-active="h-full min-h-screen w-full text-base bg-core-surface"
    id="vue-app"
  >
    <Suspense
      @pending="setLoading(true)"
      @resolve="setLoading(false)"
      @fallback="setLoading(true)"
    >
      <div
        class="bg-canvas relative flex min-h-screen flex-col items-start text-base antialiased"
      >
        <div
          class="flex w-full flex-1 flex-col"
          v-if="meta.isAvailable && meta.hasSettings"
        >
          <RouterView v-slot="routerViewProps" :key="$route.fullPath">
            <slot v-bind="routerViewProps">
              <template v-if="routerViewProps.Component">
                <Page :class="styles.page" :key="$route.fullPath">
                  <KeepAlive>
                    <Suspense
                      @pending="setLoading(true)"
                      @resolve="setLoading(false)"
                      @fallback="setLoading(true)"
                    >
                      <!-- page content -->
                      <component :is="routerViewProps.Component" />

                      <!-- fallback / loading state -->
                      <template #fallback>
                        <AsyncLoading
                          v-bind="loadingProps"
                          v-if="meta.isAvailable && meta.hasSettings"
                        />
                      </template>
                    </Suspense>
                  </KeepAlive>
                </Page>
              </template>
            </slot>
          </RouterView>
        </div>

        <slot name="footer" v-if="meta.isAvailable && meta.hasSettings" />
      </div>
    </Suspense>
  </Loading>
  <Feedback v-if="meta.isAvailable" />
</template>

<script lang="ts">
export default {
  name: "ind",
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

// --- components
import Feedback from "./modules/feedback/Feedback.vue";
import Page from "./components/content/Page.vue";
import AsyncLoading from "./modules/system/Loading.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { get, set } from "lodash-es";

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

const meta = computed(() => ({
  isAvailable: useUpmind.status.value == UpmindStatus.initialised,
  hasSettings: themeReady.value
}));

const currentRoute = useRoute();

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
