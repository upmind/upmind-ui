<template>
  <div
    class="bg-background text-foreground relative flex min-h-screen flex-col items-start antialiased"
    :data-theme="activeTheme"
    id="vue-app"
  >
    <slot name="header" />

    <main class="w-full flex-1">
      <RouterView v-slot="{ Component }" :key="$route.fullPath">
        <template v-if="Component">
          <component :is="props.contentComponent">
            <Transition mode="out-in">
              <KeepAlive>
                <Suspense>
                  <!-- main content -->
                  <component :is="Component" />

                  <!-- loading state -->
                  <template #fallback>
                    <div>
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
                        </template>
                      </UpmBasketLoading>

                      <slot name="loading-patterns" />
                    </div>
                  </template>
                </Suspense>
              </KeepAlive>
            </Transition>
          </component>
        </template>
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

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
// --- internal
import { useThemes } from "@upmind-automation/upwind";

// --- components
import UpmFeedback from "./feedback/Feedback.vue";
import UpmSessionExpired from "./session/Expired.vue";
import UpmBasketLoading from "./basket/Loading.vue";
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

function reload() {
  window.location.reload();
}
</script>
