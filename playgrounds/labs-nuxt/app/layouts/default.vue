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

        <template v-else>
          <!-- Top-level destinations (no section header) -->
          <SidebarNav v-if="looseLinks.length">
            <SidebarNavLink
              v-for="link in looseLinks"
              :key="link.label"
              :as="NuxtLink"
              :to="link.to"
              :active="link.active"
              :icon="link.icon"
            >
              {{ link.label }}
            </SidebarNavLink>
          </SidebarNav>

          <!-- Static labelled sections per R2 -->
          <template v-for="section in navSections" :key="section.value">
            <Text
              as="div"
              variant="muted"
              size="xs"
              class="mt-4 px-2 pb-1 tracking-wider uppercase"
            >
              {{ section.title }}
            </Text>
            <SidebarNav>
              <SidebarNavLink
                v-for="link in section.links"
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
        </template>
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
import { useI18n } from "vue-i18n";
import {
  UpmOverlayController,
  useRoutingEngine,
  useActiveSession,
  useSessionStore
} from "@upmind-automation/client-vue";
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

/** One destination as the rail draws it. */
type RailLink = {
  to: string | RouteLocationRaw;
  label: string;
  icon?: Component;
  active: boolean;
};

/** One labelled nav section and the destinations under it. */
type RailSection = {
  value: string;
  title: string;
  icon?: Component;
  links: RailLink[];
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
 */
function isActive(item: NavItem): boolean {
  return item.to
    ? startsWith(route.path, item.to)
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

/** Labelled sections — a top-level item that carries children. */
const navSections = computed<RailSection[]>(() =>
  map(
    filter(navigation.value, item => !!item.children?.length),
    item => ({
      value: item.label,
      title: item.label,
      icon: item.icon,
      links: map(filter(item.children, isDestination), toLink)
    })
  )
);

/** Top-level items that are destinations in their own right. */
const looseLinks = computed<RailLink[]>(() =>
  map(filter(navigation.value, isDestination), toLink)
);

/** Collapsed, there is nothing to disclose — every destination in one rail. */
const flatLinks = computed<RailLink[]>(() => [
  ...looseLinks.value,
  ...flatMap(navSections.value, section => section.links)
]);

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
