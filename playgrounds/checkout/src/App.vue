<template>
  <suspense>
    <div
      class="relative flex min-h-screen flex-col items-start bg-base-background text-base-foreground antialiased"
      :data-theme="activeTheme"
      id="app"
      vaul-drawer-wrapper
    >
      <DotHeader no-home></DotHeader>

      <main class="prose flex w-full max-w-none flex-1 flex-col">
        <UpmFeedback />

        <router-view :key="$route.fullPath" class="view" />

        <UpmSessionExpired
          :title="t('session.expired.title')"
          :text="t('session.expired.text')"
          :action="{
            label: t('session.expired.actions.continue'),
            color: 'primary',
            handler: reload,
            auto: false,
          }"
        />
      </main>

      <DotFooter />
    </div>
  </suspense>
</template>

<script setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useThemes } from "@upmind-automation/upwind";
import theme from "@/assets/theme";

// --- components
import { UpmFeedback, UpmSessionExpired } from "@upmind-automation/client-vue";
import DotHeader from "@/components/Header.vue";
import DotFooter from "@/components/Footer.vue";

const { activeTheme } = useThemes(theme);

const { t } = useI18n();

function reload() {
  window.location.reload();
}
</script>
