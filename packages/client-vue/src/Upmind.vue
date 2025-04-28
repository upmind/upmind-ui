<template>
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
          <template #logo><slot name="logo" :logo="logo"></slot></template>
        </Header>
      </slot>

      <div class="w-full flex-1">
        <RouterView v-slot="routerViewProps" :key="$route.fullPath">
          <slot v-bind="routerViewProps">
            <template v-if="routerViewProps.Component">
              <Page :class="styles.page" :key="$route.fullPath">
                <Transition mode="out-in">
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
                        <Loading v-bind="loadingProps">
                          <template #background>
                            <slot name="loading-background"></slot>
                          </template>
                        </Loading>
                      </template>
                    </Suspense>
                  </KeepAlive>
                </Transition>
              </Page>
            </template>
          </slot>
        </RouterView>
      </div>

      <slot name="footer"></slot>
    </div>
  </Suspense>

  <Feedback />
</template>

<script lang="ts">
export default {
  name: "ind",
  inheritAttrs: false,
  customOptions: {},
};
</script>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { useThemes, useStyles } from "@upmind-automation/upmind-ui";

// --- components
import Header from "./components/header/Header.vue";
import Feedback from "./modules/feedback/Feedback.vue";
import Page from "./components/content/Page.vue";
import Loading from "./modules/system/Loading.vue";

// --- utils
import { get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { InterstitialProps } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const props = defineProps<{
  theme: any;
  logo?: string;
  loadingProps?: InterstitialProps;
}>();

const { activeTheme } = useThemes(props.theme);
const currentRoute = useRoute();

const route = computed(() =>
  get(currentRoute, "name", get(currentRoute, "path", ""))
);
const loading = ref(false);

const styles = useStyles(["page"], {
  route,
  loading,
}) as ComputedRef<{
  page: string;
}>;

function setLoading(value: boolean) {
  loading.value = value;
}
</script>
