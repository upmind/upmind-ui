<template>
  <div
    class="bg-background text-foreground relative flex min-h-screen flex-col items-start antialiased"
    :data-theme="activeTheme"
    id="vue-app"
  >
    <slot name="header">
      <Header />
    </slot>

    <main class="w-full flex-1">
      <template v-if="meta.isLoading || meta.isProcessing">
        <slot name="loading">
          <Content>
            <BasketLoading
              class="min-h-screen"
              skrim="light"
              :text="t('basket.loading.text')"
              :animated-icon="{
                icon: 'basket',
                delay: 250,
                primaryColor: props.loadingPrimaryColor,
                secondaryColor: props.loadingSecondaryColor,
                size: '4xl',
              }"
            >
              <template #title>
                <SmartTitle
                  :title="tm('basket.loading.title')"
                  size="3xl"
                  align="center"
                />
              </template>

              <template #background>
                <slot name="loading-background"></slot>
              </template>
            </BasketLoading>
          </Content>
        </slot>
      </template>

      <RouterView v-slot="routerViewProps" :key="$route.fullPath">
        <slot v-bind="routerViewProps">
          <template v-if="routerViewProps.Component">
            <Content>
              <Transition mode="out-in">
                <KeepAlive>
                  <Suspense>
                    <!-- main content -->
                    <component :is="routerViewProps.Component" />

                    <!-- fallback / loading state -->
                    <template #fallback>
                      <BasketLoading
                        class="min-h-screen"
                        skrim="light"
                        :text="t('basket.loading.text')"
                        :animated-icon="{
                          icon: 'basket',
                          delay: 250,
                          primaryColor: props.loadingPrimaryColor,
                          secondaryColor: props.loadingSecondaryColor,
                          size: '4xl',
                        }"
                      >
                        <template #title>
                          <SmartTitle
                            :title="tm('basket.loading.title')"
                            size="3xl"
                            align="center"
                          />
                        </template>
                        <template #background>
                          <slot name="loading-background"></slot>
                        </template>
                      </BasketLoading>
                    </template>
                  </Suspense>
                </KeepAlive>
              </Transition>
            </Content>
          </template>
        </slot>
      </RouterView>

      <slot name="expired">
        <SessionExpired
          :title="t('session.expired.title')"
          :text="t('session.expired.text')"
          :action="{
            label: t('session.expired.actions.continue'),
            color: 'primary',
            handler: refresh,
            auto: true,
          }"
        />
      </slot>
    </main>

    <slot name="footer"></slot>
  </div>

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
import { useI18n } from "vue-i18n";

// --- internal
import { useThemes } from "@upmind-automation/upmind-ui";
import { useRoutingEngine } from "@upmind-automation/headless-vue";

// --- components
import Header from "./components/header/Header.vue";
import Feedback from "./components/feedback/Feedback.vue";
import SessionExpired from "./modules/session/components/Expired.vue";
import BasketLoading from "./modules/basket/components/Loading.vue";
import Content from "./components/content/Content.vue";
import SmartTitle from "./components/content/SmartTitle.vue";
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

const { t, tm } = useI18n();
const { activeTheme } = useThemes(props.theme);

// setup routing engine and wait for it to be resolved, this is important as it will trigger the asyn loading fallback
const { meta, refresh } = useRoutingEngine();
</script>
