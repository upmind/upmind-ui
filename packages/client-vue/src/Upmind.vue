<template>
  <div
    class="bg-background text-foreground relative flex min-h-screen flex-col items-start antialiased"
    :data-theme="activeTheme"
    id="vue-app"
  >
    <slot name="header" />

    <main class="w-full flex-1">
      <template v-if="meta.isLoading || meta.isProcessing">
        <slot name="loading">
          <UpmContent>
            <UpmBasketLoading
              class="min-h-screen"
              skrim="light"
              :title="t('basket.loading.title')"
              :text="t('basket.loading.text')"
              :animated-icon="{
                icon: 'basket',
                delay: 250,
                primaryColor: props.loadingPrimaryColor,
                secondaryColor: props.loadingSecondaryColor,
                size: '4xl',
              }"
            >
              <template #title v-if="$slots['loading-title']">
                <slot name="loading-title"></slot>
              </template>

              <template #background v-if="$slots['loading-background']">
                <slot name="loading-background"></slot>
              </template>
            </UpmBasketLoading>
          </UpmContent>
        </slot>
      </template>

      <RouterView v-slot="routerViewProps" :key="$route.fullPath">
        <slot v-bind="routerViewProps">
          <template v-if="routerViewProps.Component">
            <UpmContent>
              <Transition mode="out-in">
                <KeepAlive>
                  <Suspense>
                    <!-- main content -->
                    <component :is="routerViewProps.Component" />

                    <!-- fallback / loading state -->
                    <template #fallback>
                      <UpmBasketLoading
                        class="min-h-screen"
                        skrim="light"
                        :title="t('basket.loading.title')"
                        :text="t('basket.loading.text')"
                        :animated-icon="{
                          icon: 'basket',
                          delay: 250,
                          primaryColor: props.loadingPrimaryColor,
                          secondaryColor: props.loadingSecondaryColor,
                          size: '4xl',
                        }"
                      >
                        <template #title v-if="$slots['loading-title']">
                          <slot name="loading-title"></slot>
                        </template>

                        <template
                          #background
                          v-if="$slots['loading-background']"
                        >
                          <slot name="loading-background"></slot>
                        </template>
                      </UpmBasketLoading>
                    </template>
                  </Suspense>
                </KeepAlive>
              </Transition>
            </UpmContent>
          </template>
        </slot>
      </RouterView>

      <slot name="expired">
        <UpmSessionExpired />
      </slot>
    </main>

    <slot name="footer"></slot>
  </div>

  <UpmFeedback />
</template>

<script lang="ts">
export default {
  name: "Upmind",
  inheritAttrs: false,
  customOptions: {},
};
</script>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import {
  UpmFeedback,
  UpmSessionExpired,
  UpmBasketLoading,
  useRoutingEngine,
} from "@upmind-automation/client-vue";
import UpmContent from "./components/content/Content.vue";

// --- types

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    theme: any;
    loadingPrimaryColor?: string;
    loadingSecondaryColor?: string;
  }>(),
  {
    loadingPrimaryColor: "base-foreground",
    loadingSecondaryColor: "secondary",
  }
);

const { t } = useI18n();
const { activeTheme } = useThemes(props.theme);

// setup routing engine and wait for it to be resolved, this is important as it will trigger the asyn loading fallback
const { meta } = useRoutingEngine();
</script>
