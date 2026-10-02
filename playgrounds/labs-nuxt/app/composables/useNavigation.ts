// -----------------------------------------------------------------------------
/**
 * @module composables/useNavigation
 * @description The playground's ONE navigation derivation. Two declarative
 * sources feed the same tree — a route's `meta.nav` (the `useAuth` precedent)
 * and the scenario contract (`factory/registry`) — so a module
 * reaching the factory as a registry entry appears in the sidebar AND on the
 * landing page with neither hand-edited.
 *
 * Every declaration is one menu item, and nothing is excluded: one module is
 * one declaration (`R6-27`), so an editor is a handoff inside its own module's
 * page rather than a second destination that had to be filtered out.
 */

import { computed } from "vue";
import { useRoute, useRouter, type RouteRecordNormalized } from "vue-router";
import {
  scenarioPageKeys,
  scenarioPages
} from "../../modules/scenarios/runtime/registry";
import { navIcon } from "./useNavigation.icons";
import {
  compact,
  filter,
  find,
  first,
  get,
  groupBy,
  keys,
  map,
  reduce,
  replace,
  sortBy,
  startCase,
  toLower,
  words
} from "lodash-es";
import type {
  LabEntry,
  LabFamily,
  NavItem,
  NavMeta,
  NavSource
} from "./useNavigation.types";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

/** Which declared binding fields a developer is shown, and as what. */
const BINDING_TAGS: Record<string, string> = {
  handoff: "Handoff",
  persistCriteria: "URL state",
  tabs: "Tabs",
  useMutate: "Editable"
};

// --- Helper Functions
function familyOf(identifier: string): string {
  return toLower(first(words(replace(identifier, /^use/, ""))) ?? identifier);
}

/**
 * One url PATH SEGMENT and nothing else. `route.params` arrives DECODED, so a
 * `%2F` in the brand segment becomes a real `/` on the way into an href — and
 * `//evil.example/x` is a protocol-relative offsite link, sitting in the
 * chrome of every page. A brand id is a uuid or an org slug; anything that
 * could re-open the path is not one, and the link falls back to the bare route.
 */
const BRAND_SEGMENT = /^[\w-]+$/;

function brandSegment(brandId?: string): string | undefined {
  return brandId && BRAND_SEGMENT.test(brandId) ? brandId : undefined;
}

/**
 * Every scenario as a menu entry, read from the declaration the same way the
 * playground reads it. ONE module is ONE declaration and one entry (`R6-27`),
 * so nothing has to be excluded: an editor is a handoff inside its own module's
 * page, never a second destination. The LABEL is the composable's own name —
 * the directory the url already carries (D1) — so the menu item, the page title
 * and the path can never disagree; only the icon is declarable.
 */
function scenarioEntries(brandId?: string): LabEntry[] {
  const brand = brandSegment(brandId);

  return map(scenarioPageKeys, key => {
    // The url segment is the scenario's own DIRECTORY, which is also its route
    // name — so the sidebar link and the registered route cannot drift.
    const route = get(scenarioPages, [key, "route"], key) as string;

    return {
      key,
      label: route,
      icon: navIcon(
        get(scenarioPages, [key, "presentation", "icon"]) as string | undefined
      ),
      // The FAMILY stays the directory's: a declared label is a human name for
      // one entry, never the grouping every entry in the family answers to.
      family: familyOf(route),
      // Bare of SCOPE — every page boots as self, and only a url segment moves
      // it off that (`R6-30b`). The BRAND is not scope: it is where the app is,
      // so a menu link that dropped it walked the user out of the brand they
      // picked, which is why the brand never survived navigation.
      to: brand ? `/${brand}/${route}` : `/${route}`,
      tags: compact(
        map(keys(get(scenarioPages, key)), field => get(BINDING_TAGS, field))
      )
    };
  });
}

function routeSources(routes: RouteRecordNormalized[]): NavSource[] {
  return reduce(
    routes,
    (sources: NavSource[], route) => {
      const nav = get(route, "meta.nav") as NavMeta | undefined;
      if (nav && !nav.hidden)
        sources.push({ nav, route: route.name as string });
      return sources;
    },
    []
  );
}

type NavSourceInput = {
  nav: {
    label: string;
    icon?: string | Component;
    section?: string;
    order?: number;
    parent?: string;
  };
  route?: string;
  to?: string;
};

/**
 * Every declaration as one top-level entry. There are no sections: the entries
 * ARE the composables, so a "Composables" group grouped them by the only thing
 * they all share. Declared order first, then alphabetical — an entry that does
 * not claim a position sorts by its own label, never by registration accident.
 */
function buildNavigation(sources: NavSourceInput[]): NavItem[] {
  const top: NavItem[] = [];
  const childMap = new Map<string, NavItem[]>();

  for (const { nav, route, to } of sortBy(sources, [
    source => source.nav.order ?? 99,
    source => toLower(source.nav.label ?? "")
  ])) {
    const item: NavItem = {
      label: nav.label,
      // A route declares its icon as a NAME; the registry resolves its own.
      icon: typeof nav.icon === "string" ? navIcon(nav.icon) : nav.icon,
      route,
      to,
      dynamic: false
    };

    if (!nav.parent) {
      top.push(item);
      continue;
    }

    const siblings = childMap.get(nav.parent) ?? [];
    siblings.push(item);
    childMap.set(nav.parent, siblings);
  }

  for (const [parent, children] of childMap) {
    const owner = find(top, item => item.route === parent);
    if (owner) owner.children = children;
  }

  return top;
}

// --- Composable
export function useNavigation() {
  const router = useRouter();
  const route = useRoute();

  /** Where the app IS. Reading it here keeps every link on the live brand. */
  const brandId = computed(
    () => route.params.brandIdOrOrg as string | undefined
  );

  const routes = computed((): NavSource[] => routeSources(router.getRoutes()));

  const scenarios = computed((): LabEntry[] => scenarioEntries(brandId.value));

  const navigation = computed((): NavItem[] =>
    buildNavigation([
      ...routes.value,
      ...map(scenarios.value, entry => ({
        nav: { label: entry.label, icon: entry.icon },
        to: entry.to
      }))
    ])
  );

  /** Every composable the playground can open, both sources merged. */
  const composables = computed((): LabEntry[] =>
    sortBy(
      [
        ...map(
          filter(routes.value, source => !source.nav.parent),
          source => ({
            key: source.route as string,
            label: source.nav.label,
            icon: navIcon(source.nav.icon),
            family: familyOf(source.nav.label),
            route: source.route,
            tags: [] as string[]
          })
        ),
        ...scenarios.value
      ],
      "label"
    )
  );

  const families = computed((): LabFamily[] =>
    sortBy(
      map(groupBy(composables.value, "family"), (entries, name) => ({
        name,
        label: startCase(name),
        entries
      })),
      "label"
    )
  );

  return { composables, families, navigation };
}
