<template>
  <div
    class="bg-background text-foreground relative flex min-h-screen flex-col items-start antialiased"
    :data-theme="activeTheme"
    id="vue-app"
  >
    <slot name="header" />

    <main class="w-full flex-1 overflow-hidden">
      <template v-if="meta.isLoading || meta.isProcessing">
        <!-- routing engine -->
        <component :is="props.contentComponent">
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
        </component>
      </template>

      <RouterView v-slot="viewProps" :key="$route.fullPath">
        <slot v-bind="viewProps" v-if="viewProps?.Component">
          <Transition mode="out-in">
            <KeepAlive>
              <Suspense>
                <!-- main content -->
                <component :is="props.contentComponent">
                  <component :is="viewProps.Component" />
                </component>

                <!-- fallback / loading state -->
                <template #fallback>
                  <component :is="props.contentComponent">
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
                  </component>
                </template>
              </Suspense>
            </KeepAlive>
          </Transition>
        </slot>
      </RouterView>

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
