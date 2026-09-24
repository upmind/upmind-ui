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
        <!-- Home CARRIES the brand: `home` is `/:brandIdOrOrg?`, so a bare
             named push drops the param and leaves the brand behind. -->
        <NuxtLink
          :to="{ name: ROUTE.HOME, params: brandParams }"
          class="rounded-button focus-visible:outline-ring/40 flex min-w-0 items-center gap-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
          data-test-key="labs-logo"
        >
          <!-- The asset is a WORDMARK (viewBox 0 0 197 48), not a square mark.
               `size-6` set width AND height to 24px and squashed a 4:1 logo
               into a box; the height is fixed and the width follows it. -->
          <img
            :src="logoBlack"
            :alt="t('labs.title')"
            class="h-6 w-auto shrink-0 dark:hidden"
          />
          <img
            :src="logoWhite"
            :alt="t('labs.title')"
            class="hidden h-6 w-auto shrink-0 dark:block"
          />
          <Text
            as="span"
            size="sm"
            :class="[collapsed ? 'sr-only' : 'truncate', 'font-semibold']"
          >
            {{ t("labs.title") }}
          </Text>
        </NuxtLink>
      </template>

      <!-- The rail is the library's own `SidebarNav`: it renders the list, owns
           the active coat, `aria-current` and the collapsed sr-only + tooltip
           treatment. R2: sections are static labelled groups, not accordions. -->
      <template #nav="{ collapsed }">
        <SidebarNav v-if="collapsed" collapsed>
          <SidebarNavLink
            v-for="link in flatLinks"
            :key="link.label"
            :as="NuxtLink"
            :to="link.to"
            :active="link.active"
            :icon="link.icon"
          >
            {{ link.label }}
          </SidebarNavLink>
        </SidebarNav>

        <SidebarNav v-else>
          <SidebarNavLink
            v-for="link in flatLinks"
            :key="link.label"
            :as="NuxtLink"
            :to="link.to"
            :active="link.active"
            :icon="link.icon"
          >
            {{ link.label }}
          </SidebarNavLink>
        </SidebarNav>
      </template>

      <!-- Operator ruling: scope rides the header, beside the collapse control. -->
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
import {
  PortalShell,
  SidebarNav,
  SidebarNavLink,
  Text,
  Toaster,
  TooltipProvider
} from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  SESSION_SHELL_COMPONENTS,
  UpmOverlayController,
  useRoutingEngine,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/client-vue";
import { provideShellComponents } from "@upmind-automation/foundation";
import { filter, flatMap, includes, map, startsWith } from "lodash-es";
import type { Component } from "vue";
import type { RouteLocationRaw } from "vue-router";
import type { NavItem } from "~/composables/useNavigation.types";
import { NuxtLink } from "#components";
import logoBlack from "~/assets/logo-black.svg";
import logoWhite from "~/assets/logo-white.svg";
import { ScopeBar } from "~/components/scope";
import { SheetHost, usePlaygroundSheet } from "~/components/sheets";
import { useNavigation } from "~/composables/useNavigation";
import { ROUTE } from "~/funnels";
// -----------------------------------------------------------------------------

provideShellComponents(computed(() => SESSION_SHELL_COMPONENTS));

/** One destination as the rail draws it. */
type RailLink = {
  to: string | RouteLocationRaw;
  label: string;
  icon?: Component;
  active: boolean;
};

const { navigation } = useNavigation();
const { t } = useI18n();
const route = useRoute();

/** Only the brand travels. `scopeSuffix` belongs to the page that named it. */
const brandParams = computed(() =>
  route.params.brandIdOrOrg ? { brandIdOrOrg: route.params.brandIdOrOrg } : {}
);
const router = useRouter();
const { meta: routingMeta, isReady } = useRoutingEngine();

/**
 * A registry-derived item owns a PATH and its scope suffix extends it
 * (`/as/:actor/for/:type/:id`); a route-declared one owns a named record.
 *
 * The prefix must land on a SEGMENT boundary. A bare `startsWith` lights up
 * every sibling whose path is a prefix of another's — `/useInvoice` matches
 * `/useInvoices`, so both read as current — and the rail then says the user is
 * in two places at once.
 */
function isActive(item: NavItem): boolean {
  return item.to
    ? route.path === item.to || startsWith(route.path, `${item.to}/`)
    : !!item.route && route.name === item.route;
}

function toLink(item: NavItem): RailLink {
  return {
    // A named target CARRIES the brand: every page is `/:brandIdOrOrg?/…`, so a
    // bare name drops the param and walks the user out of the brand they picked.
    to: item.to ?? { name: item.route!, params: brandParams.value },
    label: item.label,
    icon: item.icon,
    active: isActive(item)
  };
}

const isDestination = (item: NavItem): boolean => !!(item.to || item.route);

/** Every destination in one rail, a nested child included. */
const flatLinks = computed<RailLink[]>(() =>
  map(
    filter(
      flatMap(navigation.value, item => [item, ...(item.children ?? [])]),
      isDestination
    ),
    toLink
  )
);

// --- debug items
const { register } = usePlaygroundSheet();

// --- computed
const _isAuthRoute = computed(() =>
  includes(route.name?.toString() ?? "", ROUTE.SESSION)
);

// --- side effects
// set up automatic redirects when the user logs in or out
isReady().then(() => {
  // Switching the active actor (client -> guest) is not a logout; only the
  // store's logout signal is, so the redirect listens to that alone.
  const { onLogout } = useSessionStore().useActions();
  onLogout(() => {
    if (!routingMeta.value.isResolved) return;
    if (route.name !== ROUTE.SESSION_END) {
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
