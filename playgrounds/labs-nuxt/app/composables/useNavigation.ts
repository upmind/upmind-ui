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
  registry,
  scenarioKeys
} from "../../modules/scenarios/runtime/registry";
import { FALLBACK_ICON, navIcon } from "./useNavigation.icons";
import {
  compact,
  filter,
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
  NavSection,
  NavSource
} from "./useNavigation.types";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

// Section config - defines section order and icons
const SECTION_CONFIG: Record<string, { icon: Component; order: number }> = {
  Composables: { icon: navIcon("code-browser"), order: 1 },
  Labs: { icon: navIcon("beaker-01"), order: 2 },
  "Client Management": { icon: navIcon("users-01"), order: 3 },
  Products: { icon: navIcon("shopping-bag-02"), order: 4 },
  Invoices: { icon: navIcon("receipt"), order: 5 },
  Session: { icon: navIcon("lock-01"), order: 6 },
  Portal: { icon: navIcon("user-01"), order: 7 },
  Admin: { icon: navIcon("shield-01"), order: 8 }
};

/** A family with no icon of its own still lists — it falls back. */
const FAMILY_CONFIG: Record<string, Component> = {
  auth: navIcon("lock-01"),
  basket: navIcon("shopping-cart-01"),
  client: navIcon("users-01"),
  invoices: navIcon("receipt"),
  orders: navIcon("shopping-bag-02"),
  products: navIcon("package")
};

/** Which declared binding fields a developer is shown, and as what. */
const BINDING_TAGS: Record<string, string> = {
  handoff: "Handoff",
  persistCriteria: "URL state",
  useMutate: "Editable"
};

const COMPOSABLES_SECTION = "Composables";

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

  return map(scenarioKeys, key => {
    // The url segment is the scenario's own DIRECTORY, which is also its route
    // name — so the sidebar link and the registered route cannot drift.
    const route = get(registry, [key, "route"], key) as string;

    return {
      key,
      label: route,
      icon: navIcon(
        get(registry, [key, "presentation", "icon"]) as string | undefined
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
        map(keys(get(registry, key)), field => get(BINDING_TAGS, field))
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

function buildNavigationTree(
  sources: NavSourceInput[]
): Map<string, NavItem[]> {
  const sectionMap = new Map<string, NavItem[]>();
  const childMap = new Map<string, NavItem[]>(); // parent route name -> children

  for (const { nav, route, to } of sortBy(
    sources,
    source => source.nav.order ?? 99
  )) {
    const bucket = nav.parent ? childMap : sectionMap;
    const bucketKey = nav.parent ?? nav.section ?? "Other";
    const items = bucket.get(bucketKey) ?? [];

    // Convert string icon names to Components; pass through existing Components
    const icon = typeof nav.icon === "string" ? navIcon(nav.icon) : nav.icon;

    items.push({
      label: nav.label,
      icon,
      route,
      to,
      dynamic: false
    });
    bucket.set(bucketKey, items);
  }

  // Attach children to parent items and sum counts
  for (const [parentName, children] of childMap) {
    for (const [, items] of sectionMap) {
      for (const item of items) {
        if (item.route === parentName) {
          item.children = children;
        }
      }
    }
  }

  return sectionMap;
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

  const navigation = computed((): NavItem[] => {
    const sectionMap = buildNavigationTree([
      ...routes.value,
      ...map(scenarios.value, entry => ({
        nav: {
          label: entry.label,
          icon: entry.icon,
          section: COMPOSABLES_SECTION
        },
        to: entry.to
      }))
    ]);

    // Build final navigation array
    const result: NavItem[] = [];
    const sections: NavSection[] = [];

    for (const [sectionName, items] of sectionMap) {
      const config = SECTION_CONFIG[sectionName] || {
        icon: navIcon("folder"),
        order: 99
      };

      // Labs items go directly to top level (not grouped)
      if (sectionName === "Labs") {
        result.push(...items);
      } else {
        sections.push({
          label: sectionName,
          icon: config.icon,
          order: config.order,
          children: items
        });
      }
    }

    // Add top-level Labs items first (already in result), then sections
    for (const section of sortBy(sections, "order")) {
      result.push({
        label: section.label,
        icon: section.icon,
        children: section.children
      });
    }

    return result;
  });

  /** Every composable the playground can open, both sources merged. */
  const composables = computed((): LabEntry[] =>
    sortBy(
      [
        ...map(
          filter(
            routes.value,
            source =>
              source.nav.section === COMPOSABLES_SECTION && !source.nav.parent
          ),
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
        icon: get(FAMILY_CONFIG, name, FALLBACK_ICON),
        entries
      })),
      "label"
    )
  );

  return { composables, families, navigation };
}
