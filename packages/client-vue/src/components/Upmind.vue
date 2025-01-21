<template>
  <div
    class="bg-background text-foreground relative flex min-h-screen flex-col items-start antialiased"
    :data-theme="activeTheme"
    id="vue-app"
  >
    <slot name="header" />

    <main class="w-full flex-1 overflow-hidden">
      <component :is="props.contentComponent">
        <template v-if="meta.isLoading || meta.isProcessing">
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
              <slot name="loading-title" />
              <pre>ROUTING ENGINE</pre>
            </template>

            <template #background v-if="$slots['loading-background']">
              <slot name="loading-background" />
            </template>
          </UpmBasketLoading>
        </template>

        <RouterView v-slot="{ Component }" :key="$route.fullPath">
          <template v-if="Component">
            <Transition mode="out-in">
              <KeepAlive>
                <Suspense>
                  <!-- main content -->
                  <component :is="Component" />

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
                        <slot name="loading-title" />
                        <pre>SUSPENSE</pre>
                      </template>

                      <template #background v-if="$slots['loading-background']">
                        <slot name="loading-background" />
                      </template>
                    </UpmBasketLoading>
                  </template>
                </Suspense>
              </KeepAlive>
            </Transition>
          </template>
        </RouterView>
      </component>

      <UpmSessionExpired
        :title="t('session.expired.title')"
        :text="t('session.expired.text')"
        :action="{
          label: t('session.expired.actions.continue'),
          color: 'primary',
          handler: reload,
          auto: true,
        }"
      />
    </main>

    <slot name="footer" />
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
import { useThemes } from "@upmind-automation/upwind";

// --- components
import {
  UpmFeedback,
  UpmSessionExpired,
  UpmBasketLoading,
  useRoutingEngine,
} from "@upmind-automation/client-vue";
import UpmContent from "./content/Content.vue";

// --- types
import type { Component } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    contentComponent?: Component | string;
    theme: any;
    loadingPrimaryColor?: string;
    loadingSecondaryColor?: string;
  }>(),
  {
    loadingPrimaryColor: "base-foreground",
    loadingSecondaryColor: "secondary",
    contentComponent: UpmContent,
  }
);

const { t } = useI18n();
const { activeTheme } = useThemes(props.theme);

// setup routing engine and wait for it to be resolved, this is important as it will trigger the asyn loading fallback
const { meta } = useRoutingEngine();

function reload() {
  window.location.reload();
}
</script>
