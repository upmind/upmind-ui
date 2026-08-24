<template>
  <TooltipProvider>
    <PortalShell
      nav="sidebar"
      frame="full"
      :nav-label="t('labs.navigation')"
      :open-nav-label="t('labs.open_navigation')"
      :close-nav-label="t('labs.close_navigation')"
      :skip-label="t('labs.skip_to_content')"
    >
      <template #logo="{ collapsed }">
        <NuxtLink
          :to="{ name: ROUTE.HOME }"
          class="rounded-button focus-visible:outline-ring/40 flex min-w-0 items-center gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
          data-test-key="labs-logo"
        >
          <img
            :src="logoBlack"
            alt=""
            aria-hidden="true"
            class="size-6 shrink-0 dark:hidden"
          />
          <img
            :src="logoWhite"
            alt=""
            aria-hidden="true"
            class="hidden size-6 shrink-0 dark:block"
          />
          <span
            :class="
              collapsed
                ? 'sr-only'
                : 'type-display text-display truncate text-base'
            "
          >
            {{ t("labs.title") }}
          </span>
        </NuxtLink>
      </template>

      <template #nav="{ collapsed }">
        <ul class="flex flex-col gap-1">
          <li v-for="(item, index) in navigation" :key="index">
            <NavSection :item="item" :depth="0" :collapsed="collapsed" />
          </li>
        </ul>
      </template>

      <template #header-actions>
        <ScopeBar />
      </template>

      <slot />

      <template #footer>
        <p class="text-muted text-xs">
          {{ t("labs.footer") }}
        </p>
      </template>
    </PortalShell>

    <UpmOverlayController />
  </TooltipProvider>

  <SheetHost />

  <Toaster
    position="top-center"
    close-button
    rich-colors
    expand
    :visible-toasts="6"
    :duration="6000"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import {
  UpmOverlayController,
  useRoutingEngine,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/client-vue";
import { PortalShell, Toaster, TooltipProvider } from "@upmind/ui";
import { includes } from "lodash-es";
import NavSection from "~/components/NavSection.vue";
import { ScopeBar } from "~/components/scope";
import { SheetHost, usePlaygroundSheet } from "~/components/sheets";
import { useNavigation } from "~/composables/useNavigation";
import { ROUTE } from "~/funnels";
import logoBlack from "~/assets/logo-black.svg";
import logoWhite from "~/assets/logo-white.svg";
// -----------------------------------------------------------------------------
const { navigation } = useNavigation();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { meta: routingMeta, isReady } = useRoutingEngine();

// --- debug items
const { register } = usePlaygroundSheet();

// --- computed
const _isAuthRoute = computed(() =>
  includes(route.name?.toString() ?? "", ROUTE.SESSION)
);

// --- side effects
// set up automatic redirects when the user logs in or out
isReady().then(() => {
  const { isAuthenticated } = useActiveSession().useMeta();
  watch(isAuthenticated, (isAuth, wasAuth) => {
    if (!routingMeta.value.isResolved) return;

    if (!isAuth && wasAuth && route.name !== ROUTE.SESSION_END) {
      router.push({ name: ROUTE.SESSION_END });
    }
  });
});

// --- Session information for authenticated actor (if any)
const activeSession = useActiveSession();
const { actor, session } = activeSession.useContext();
const sessionStore = useSessionStore();
const { clientSessions, guestSession, impersonatedSessions, staffSessions } =
  sessionStore.useContext();

register(
  {
    key: "useAuth-session",
    factory: () => ({
      // The section NAME is what the host draws as the tab (`SheetHost`), so it
      // is resolved here rather than carried as a key the tab would print raw.
      name: t("labs.debug_session"),
      state: actor.value || "guest",
      meta: activeSession.useMeta(),
      context: {
        session: session.value,
        sessions: {
          staff: staffSessions.value,
          clients: clientSessions.value,
          guest: guestSession.value,
          impersonatedSessions: impersonatedSessions.value
        }
      }
    })
  },
  true
);
</script>
