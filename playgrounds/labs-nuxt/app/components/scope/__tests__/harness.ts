// -----------------------------------------------------------------------------
/**
 * @module components/scope/__tests__/harness
 * @description The bench the four scope specs share: a session store doubled at
 * its published surface, the real `labs` catalogue installed as the app installs
 * it, and the client-emails route the acting-for segment reads its matrix off.
 *
 * The store is doubled rather than booted because its own behaviour is
 * `packages/headless`'s contract, not this story's — but it is doubled
 * FAITHFULLY (`remove` restores the impersonation parent, `getExpiresAt` is
 * `created_at + expires_in`), so a parity cell is read off rendered output
 * rather than off a spy call.
 *
 * T2.5 orphan disposition: NOTHING was orphaned by the four deletions. This
 * directory did not exist on the base commit (`git ls-tree HEAD` over
 * `app/components/scope` returns no test file), and no spec anywhere in the repo
 * named `ActorScopeSelector` · `BrandScopeSelector` · `ContextScopeSelector` ·
 * `ImpersonationBar` or their `actor-scope-*` hooks. So no assertion was moved
 * and none was retired — the four specs here are the pool's first coverage, not
 * a rewrite of an earlier one.
 */

import { config, mount } from "@vue/test-utils";
import { vi } from "vitest";
import { computed, defineComponent, h, ref } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { AccessRoleTypes } from "@upmind-automation/types";
import { ROUTE } from "../../../funnels/types";
import {
  find,
  first,
  forEach,
  get,
  keys,
  map,
  omit,
  pickBy,
  some,
  values
} from "lodash-es";
import type { ScopeContextForm } from "../useContextScopeSelector";
import type {
  ActorContextMatrix,
  SessionEntry
} from "@upmind-automation/headless";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import type { Router } from "vue-router";

// Nuxt's middleware wrappers are globals to a bare vitest module graph; the
// scope middleware is imported for real so the bench parses a scope path the
// way the app does, rather than re-deriving it.
vi.stubGlobal("defineNuxtRouteMiddleware", (middleware: unknown) => middleware);
vi.stubGlobal("navigateTo", (to: unknown) => to);

// -----------------------------------------------------------------------------

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;

/** The client-emails page the acting-for segment reads its declared matrix off (K7). */
export const CLIENT_EMAILS_ROUTE = "useClientEmails";

/** The custom-fields page, whose own module declares the catalogue contexts. */
export const CLIENT_CUSTOM_FIELDS_ROUTE = "useClientCustomFields";

export type SessionSeed = {
  id: string;
  actor: AccessRoleTypes;
  publicName?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  /** Time left before the token expires; negative is already past. */
  expiresIn?: number;
  /** Session id of the staff session that impersonated this one. */
  impersonatedBy?: string;
  /** The brand this session's client belongs to; staff carry none. */
  brandId?: string;
};

type Sessions = Record<string, SessionEntry>;

const clientSessions = ref<Sessions>({});
const staffSessions = ref<Sessions>({});
const guestSessions = ref<Sessions>({});
const impersonatedSessions = ref<Record<string, string>>({});
const activeActor = ref<AccessRoleTypes>(AccessRoleTypes.GUEST);
const activeSessionId = ref<string | undefined>(undefined);
const storeAvailable = ref(true);
const allowedScopes = ref<AccessRoleTypes[]>([
  AccessRoleTypes.GUEST,
  AccessRoleTypes.CLIENT,
  AccessRoleTypes.STAFF
]);

function entry(seed: SessionSeed): SessionEntry {
  // A seed that names nothing carries NO email either — the label chain's last
  // leg (`id`) is only reachable when the three before it are genuinely absent.
  const user = {
    id: seed.id,
    language: "en",
    locale: "en-GB",
    ...pickBy({
      publicName: seed.publicName,
      fullName: seed.fullName,
      email: seed.email,
      username: seed.email,
      brandId: seed.brandId
    }),
    ...(seed.avatar
      ? { avatar: { caption: seed.publicName ?? seed.id, src: seed.avatar } }
      : {})
  };

  return {
    scope: seed.actor,
    token: {
      access_token: `token-${seed.id}`,
      actor_id: seed.id,
      created_at: Date.now(),
      expires_in: (seed.expiresIn ?? HOUR_MS) / 1000
    },
    // A guest has no `/self` profile, so its entry carries no user.
    ...(seed.actor === AccessRoleTypes.GUEST ? {} : { user })
  } as unknown as SessionEntry;
}

/** The pool a seed belongs in — guest keys by session id like the other two. */
function bagFor(actor: AccessRoleTypes) {
  if (actor === AccessRoleTypes.STAFF) return staffSessions;
  if (actor === AccessRoleTypes.GUEST) return guestSessions;
  return clientSessions;
}

/**
 * Put the pool in a known state. `active` names the session the store reports
 * as active; without one the store reads as a bare guest. `guest: true` adds
 * the single cookie-backed guest a boot leaves behind.
 */
export function seedPool(
  seeds: SessionSeed[],
  options: { active?: string; guest?: boolean; available?: boolean } = {}
): void {
  clientSessions.value = {};
  staffSessions.value = {};
  guestSessions.value = {};
  impersonatedSessions.value = {};
  storeAvailable.value = options.available ?? true;
  allowedScopes.value = [
    AccessRoleTypes.GUEST,
    AccessRoleTypes.CLIENT,
    AccessRoleTypes.STAFF
  ];

  const pooled = options.guest
    ? [...seeds, { id: "guest-live", actor: AccessRoleTypes.GUEST }]
    : seeds;

  forEach(pooled, seed => {
    const bag = bagFor(seed.actor);
    bag.value = { ...bag.value, [seed.id]: entry(seed) };
    if (seed.impersonatedBy)
      impersonatedSessions.value = {
        ...impersonatedSessions.value,
        [seed.id]: seed.impersonatedBy
      };
  });

  const activeSeed = find(pooled, { id: options.active });
  activeSessionId.value = activeSeed?.id;
  activeActor.value = activeSeed?.actor ?? AccessRoleTypes.GUEST;
}

/** The store as the pool reads it — `remove`'s parent restoration included. */
function sessionStoreDouble() {
  const allSessions = computed(() => ({
    ...clientSessions.value,
    ...staffSessions.value,
    ...guestSessions.value
  }));

  const activeSession = computed(() =>
    activeSessionId.value ? allSessions.value[activeSessionId.value] : undefined
  );

  // The singular member is the LIVE guest — the one the pointer names when it
  // names a guest at all, else the first pooled.
  const guestSession = computed(() => {
    const live =
      activeActor.value === AccessRoleTypes.GUEST && activeSessionId.value
        ? guestSessions.value[activeSessionId.value]
        : undefined;
    return (live ?? first(values(guestSessions.value)))?.token;
  });

  function activate(actor: AccessRoleTypes, sessionId?: string): void {
    if (!some(allowedScopes.value, allowed => allowed === actor)) return;

    // Both arms of the real store return early when their actor is already
    // active on a named session, so a scope-level `activate(actor)` carrying no
    // id never stomps that session back to the pool's first entry.
    const activeIsNamed =
      activeActor.value === actor &&
      !!activeSessionId.value &&
      !!bagFor(actor).value[activeSessionId.value];
    if (activeIsNamed && (!sessionId || sessionId === activeSessionId.value))
      return;

    activeActor.value = actor;
    activeSessionId.value = sessionId ?? keys(bagFor(actor).value)[0];
  }

  /** A NEW guest beside the pooled ones, active; the previous stays switchable. */
  function addGuest(): Promise<void> {
    const id = `guest-added-${keys(guestSessions.value).length + 1}`;
    guestSessions.value = {
      ...guestSessions.value,
      [id]: entry({ id, actor: AccessRoleTypes.GUEST })
    };
    activeActor.value = AccessRoleTypes.GUEST;
    activeSessionId.value = id;
    return Promise.resolve();
  }

  function remove(actor: AccessRoleTypes, sessionId?: string): void {
    const targetId = sessionId ?? keys(bagFor(actor).value)[0];
    if (!targetId) return;

    const wasActive = targetId === activeSessionId.value;
    const parentId = impersonatedSessions.value[targetId];

    bagFor(actor).value = omit(bagFor(actor).value, targetId);
    impersonatedSessions.value = omit(impersonatedSessions.value, targetId);

    if (!wasActive) return;

    const parent = parentId ? allSessions.value[parentId] : undefined;
    activeSessionId.value = parent ? parentId : undefined;
    activeActor.value = parent
      ? (parent.scope as AccessRoleTypes)
      : AccessRoleTypes.GUEST;
  }

  return {
    initStore: () => Promise.resolve(),
    useActions: () => ({
      activate,
      add: () => Promise.resolve(),
      addGuest,
      clear: () => seedPool([]),
      get: (id: string) => allSessions.value[id],
      getExpiresAt: (token?: { created_at?: number; expires_in?: number }) =>
        token?.created_at
          ? token.created_at + (token.expires_in ?? 0) * 1000
          : null,
      isReady: () => Promise.resolve(true),
      logout: (actor?: AccessRoleTypes) =>
        remove(
          actor ?? activeActor.value,
          actor && actor !== activeActor.value
            ? undefined
            : activeSessionId.value
        ),
      onLogout: () => () => undefined,
      refresh: () => Promise.resolve(),
      registerImpersonation: (id: string) => {
        impersonatedSessions.value = {
          ...impersonatedSessions.value,
          [id]: String(activeSessionId.value)
        };
      },
      remove,
      updateUser: () => undefined
    }),
    useContext: () => ({
      activeActor,
      activeSession,
      activeSessionId,
      activeUser: computed(() => activeSession.value?.user),
      allSessions,
      clientSessions,
      expiresAt: computed(() => null),
      guestSession,
      guestSessions,
      impersonatedSession: computed(() => {
        const id = activeSessionId.value;
        const impersonatorId = id ? impersonatedSessions.value[id] : undefined;
        return impersonatorId ? { impersonatedId: id, impersonatorId } : null;
      }),
      impersonatedSessions,
      staffSessions
    }),
    useInternals: () => ({}),
    useMeta: () => ({
      hasClientSession: computed(() => !!keys(clientSessions.value).length),
      hasGuestSession: computed(() => !!keys(guestSessions.value).length),
      hasImpersonatedSessions: computed(
        () => !!keys(impersonatedSessions.value).length
      ),
      hasMultipleSessions: computed(
        () =>
          keys({ ...clientSessions.value, ...staffSessions.value }).length > 1
      ),
      hasStaffSession: computed(() => !!keys(staffSessions.value).length),
      isAvailable: computed(() => storeAvailable.value),
      isLoading: computed(() => false),
      isScopeAllowed: (actor: AccessRoleTypes) =>
        some(allowedScopes.value, allowed => allowed === actor)
    })
  };
}

export const HOST_BRAND = { id: "brand-x", name: "Brand X" };

/**
 * The headless barrel with its two app-facing singletons doubled. Everything
 * else — `ScopeActorTypes`, the matrices, `useRelativeTime` — stays real,
 * because the greying axis is read off the client-emails page's OWN declared matrix.
 */
export function headlessDouble(real: object): object {
  return {
    ...real,
    useBrand: () => ({
      brandId: ref(HOST_BRAND.id),
      name: ref(HOST_BRAND.name),
      isReady: computed(() => true)
    }),
    useSessionStore: sessionStoreDouble
  };
}

// -----------------------------------------------------------------------------

/**
 * The playground's own namespace, added to the catalogue the component lane
 * already installs — a second `createI18n` would install a second copy of
 * vue-i18n's components over the same app.
 */
export function installLabsCatalogue(): void {
  forEach(config.global.plugins, plugin => {
    const catalogue = get(plugin, ["global"]) as
      | { mergeLocaleMessage?: (locale: string, messages: object) => void }
      | undefined;
    catalogue?.mergeLocaleMessage?.("en", { labs: labsEn });
  });
}

/** The catalogue's own value for a key — what a resolved string must read as. */
export function labs(key: string, params?: Record<string, unknown>): string {
  const value = String(get(labsEn, key));
  return params
    ? value.replace(/\{(\w+)\}/g, (_, name) => String(params[name]))
    : value;
}

export async function clientEmailsRouter(path: string): Promise<Router> {
  // The url writer's bag is process-wide and reads the query off history, so
  // the window has to BE at the case's url — and be seen to move there —
  // before anything reads it.
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new window.PopStateEvent("popstate"));

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      // The landing route's name is the app's own: `app/pages/index.vue` names
      // it `home`, which is what `ROUTE.HOME` the funnels target resolves to.
      { path: "/", name: ROUTE.HOME, component: { template: "<div />" } },
      {
        path: `/${CLIENT_EMAILS_ROUTE}/:scopeSuffix(.*)*`,
        name: CLIENT_EMAILS_ROUTE,
        component: { template: "<div />" },
        meta: { scenario: CLIENT_EMAILS_ROUTE }
      },
      {
        path: `/:brandIdOrOrg/${CLIENT_EMAILS_ROUTE}/:scopeSuffix(.*)*`,
        name: `${CLIENT_EMAILS_ROUTE}-branded`,
        component: { template: "<div />" },
        meta: { scenario: CLIENT_EMAILS_ROUTE }
      },
      {
        path: `/${CLIENT_CUSTOM_FIELDS_ROUTE}/:scopeSuffix(.*)*`,
        name: CLIENT_CUSTOM_FIELDS_ROUTE,
        component: { template: "<div />" },
        meta: { scenario: CLIENT_CUSTOM_FIELDS_ROUTE }
      },
      {
        path: "/useAuth/:scopeSuffix(.*)*",
        name: "useAuth",
        component: { template: "<div />" }
      }
    ]
  });

  const { default: scopeMiddleware } =
    await import("../../../middleware/scope.global");
  router.beforeEach(to =>
    (scopeMiddleware as (to: unknown, from: unknown) => void)(to, to)
  );

  await router.push(path);
  await router.isReady();

  return router;
}

export type Bench = { wrapper: VueWrapper; router: Router };

/** One mount of a scope surface, on a real router at a real scope path. */
/**
 * The page registers its composable's OWN matrix (`R6-31`) — the declaration no
 * longer carries one — so the bench does what `ScenarioPlayground` does before
 * the segment can have any rows to draw.
 */
async function pageRegistering(
  component: Component,
  matrix?: ActorContextMatrix,
  form?: ScopeContextForm
): Promise<Component> {
  const { CLIENT_EMAILS_SCOPE_MATRIX } =
    await import("@upmind-automation/headless");
  const { useContextScopeSelector } =
    await import("../useContextScopeSelector");

  return defineComponent({
    setup() {
      useContextScopeSelector().register(
        matrix ?? CLIENT_EMAILS_SCOPE_MATRIX,
        form
      );
      return () => h(component as never);
    }
  });
}

/**
 * @param component - The scope surface under test.
 * @param path - The scope url the page is opened on.
 * @param matrix - The matrix the page registers, for a case whose subject is a
 * declaration the client-emails page does not carry. Defaults to that page's.
 * @param form - The "Act for" form the page registers beside its matrix.
 */
export async function benchOn(
  component: Component,
  path = `/${CLIENT_EMAILS_ROUTE}/as/client`,
  matrix?: ActorContextMatrix,
  form?: ScopeContextForm
): Promise<Bench> {
  installLabsCatalogue();
  const router = await clientEmailsRouter(path);

  const wrapper = mount(
    (await pageRegistering(component, matrix, form)) as never,
    {
      attachTo: document.body,
      global: { plugins: [router] }
    }
  );
  await flush();

  return { wrapper, router };
}

export async function flush(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// -----------------------------------------------------------------------------

/** Every node the app tagged with a stable hook, panels included. */
export const nodes = (key: string): HTMLElement[] =>
  Array.from(document.querySelectorAll(`[data-test-key='${key}']`));

export const node = (key: string): HTMLElement | null =>
  document.querySelector(`[data-test-key='${key}']`);

/** Open a dropdown by its trigger's hook, and hand back the panel it opened. */
export async function openPanel(key: string): Promise<HTMLElement> {
  const trigger = node(key);
  if (!trigger) throw new Error(`no trigger for ${key}`);

  trigger.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
  );
  await flush();

  const panels = document.querySelectorAll<HTMLElement>("[role='menu']");
  const panel = panels[panels.length - 1];
  if (!panel) throw new Error(`${key} opened no panel`);

  return panel;
}

export const rows = (panel: Element): HTMLElement[] =>
  Array.from(panel.querySelectorAll("[role='menuitem']"));

export const textOf = (element: Element | null | undefined): string =>
  (element?.textContent ?? "").replace(/\s+/g, " ").trim();

/** The labels a panel's own group labels carry, in render order. */
export const groupLabels = (panel: Element): string[] =>
  map(
    Array.from(panel.children).filter(
      child => child.getAttribute("role") !== "group"
    ),
    textOf
  ).filter(Boolean);

export function resetDom(): void {
  document.body.innerHTML = "";
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
}
