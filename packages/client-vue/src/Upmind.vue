<template>
  <Loading
    :active="!themeMeta.isAvailable"
    class="h-screen w-full !text-gray-400"
  >
    <Suspense
      @pending="setLoading(true)"
      @resolve="setLoading(false)"
      @fallback="setLoading(true)"
    >
      <div
        class="bg-background text-foreground relative flex min-h-screen flex-col items-start antialiased"
        :data-theme="activeTheme"
        id="vue-app"
      >
        <slot name="header">
          <Header :logo="logo">
            <template #actions>
              <slot name="actions" />
            </template>
            <template #logo><slot name="logo" :logo="logo"></slot></template>
          </Header>
        </slot>

        <main class="w-full flex-1">
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
                        <AsyncLoading v-bind="loadingProps" />
                      </template>
                    </Suspense>
                  </KeepAlive>
                </Page>
              </template>
            </slot>
          </RouterView>
        </main>

        <slot name="footer">
          <Footer />
        </slot>
      </div>
    </Suspense>
  </Loading>
  <Feedback />
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
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { useThemes, useStyles } from "@upmind-automation/upmind-ui";
import { useBrandTheme } from "./modules/brand";

// --- components
import Footer from "./components/footer/Footer.vue";
import Header from "./components/header/Header.vue";
import Feedback from "./modules/feedback/Feedback.vue";
import Page from "./components/content/Page.vue";
import AsyncLoading from "./modules/system/Loading.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<{
  theme?: any;
  logo?: string;
  loadingProps?: InterstitialProps;
}>();
const loading = ref(true);

// -----------------------------------------------------------------------------

const { theme, isReady, meta: themeMeta } = useBrandTheme(props.theme);
isReady().then(() => {
  if (!theme.value) {
    console.warn("No theme found, using default theme.");
    return;
  }
  add(theme.value);
});

const { activeTheme, add } = useThemes(theme.value);
const currentRoute = useRoute();

const route = computed(() =>
  get(currentRoute, "name", get(currentRoute, "path", ""))
);

const styles = useStyles(["page"], {
  route,
  loading
}) as ComputedRef<{
  page: string;
}>;

function setLoading(value: boolean) {
  loading.value = value;
}
</script>
