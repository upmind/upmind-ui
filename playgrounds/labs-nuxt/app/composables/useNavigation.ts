// -----------------------------------------------------------------------------
/**
 * @module composables/useNavigation
 * @description The playground's ONE navigation derivation. Two declarative
 * sources feed the same tree — a route's `meta.nav` (the `useAuth` precedent)
 * and the scenario contract (`factory/registry`) — so a module
 * reaching the factory as a registry entry appears in the sidebar AND on the
 * landing page with neither hand-edited.
 *
 * Navigability is derived from the contract's own handoff relations rather than
 * declared a second time: one composable family is one menu item.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, type RouteRecordNormalized } from "vue-router";
import {
  registry,
  scenarioKeys
} from "../../modules/scenarios/runtime/registry";
import {
  compact,
  difference,
  filter,
  first,
  flatMap,
  get,
  groupBy,
  keys,
  map,
  reduce,
  replace,
  sortBy,
  startCase,
  toLower,
  values,
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
import type { ScenarioNav } from "../../modules/scenarios/runtime/scenario.types";

// -----------------------------------------------------------------------------

// Section config - defines section order and icons
const SECTION_CONFIG: Record<string, { icon: string; order: number }> = {
  Composables: { icon: "code-browser", order: 1 },
  Labs: { icon: "beaker-01", order: 2 },
  "Client Management": { icon: "users-01", order: 3 },
  Products: { icon: "shopping-bag-02", order: 4 },
  Invoices: { icon: "receipt", order: 5 },
  Session: { icon: "lock-01", order: 6 },
  Portal: { icon: "user-01", order: 7 },
  Admin: { icon: "shield-01", order: 8 }
};

/** A family with no icon of its own still lists — it falls back. */
const FAMILY_CONFIG: Record<string, string> = {
  auth: "lock-01",
  basket: "shopping-cart-01",
  client: "users-01",
  invoices: "receipt",
  orders: "shopping-bag-02",
  products: "package"
};

/** Which declared binding fields a developer is shown, and as what. */
const BINDING_TAGS: Record<string, string> = {
  handoff: "Handoff",
  persistCriteria: "URL state",
  useMutate: "Editable"
};

const COMPOSABLES_SECTION = "Composables";
const SCENARIO_ICON = "code-browser";
const FALLBACK_FAMILY_ICON = "layers-three-01";

// --- Helper Functions
function familyOf(identifier: string): string {
  return toLower(first(words(replace(identifier, /^use/, ""))) ?? identifier);
}

const HANDOFF_TARGET_KEYS: string[] = flatMap(scenarioKeys, key =>
  map(values(get(registry, [key, "handoff"])), "target")
);

/**
 * A key another scenario hands off to is an internal destination — the editor
 * a row opens — so it is not its own menu item; one composable family is one
 * entry. Derived from the handoff relation the contract already declares, so a
 * module never has to remember a second flag as the registry grows.
 */
const NAVIGABLE_KEYS = difference(scenarioKeys, HANDOFF_TARGET_KEYS);

/**
 * Every navigable scenario as a menu entry, read from the declaration the same
 * way the playground reads it: a scenario that declared `nav` is called and
 * iconed what it said, and only one that declared none falls back to its own
 * directory humanised.
 */
function scenarioEntries(translate: (key: string) => string): LabEntry[] {
  return map(NAVIGABLE_KEYS, key => {
    // The url segment is the scenario's own DIRECTORY, which is also its route
    // name — so the sidebar link and the registered route cannot drift.
    const route = get(registry, [key, "route"], key) as string;
    const nav = get(registry, [key, "nav"]) as ScenarioNav | undefined;

    return {
      key,
      label: nav ? translate(nav.i18n) : startCase(route),
      icon: nav?.icon ?? SCENARIO_ICON,
      // The FAMILY stays the directory's: a declared label is a human name for
      // one entry, never the grouping every entry in the family answers to.
      family: familyOf(route),
      to: `/${route}/as/${get(registry, [key, "scope", "actor"])}`,
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

function buildNavigationTree(sources: NavSource[]): Map<string, NavItem[]> {
  const sectionMap = new Map<string, NavItem[]>();
  const childMap = new Map<string, NavItem[]>(); // parent route name -> children

  for (const { nav, route, to } of sortBy(
    sources,
    source => source.nav.order ?? 99
  )) {
    const bucket = nav.parent ? childMap : sectionMap;
    const bucketKey = nav.parent ?? nav.section ?? "Other";
    const items = bucket.get(bucketKey) ?? [];

    items.push({ label: nav.label, icon: nav.icon, route, to, dynamic: false });
    bucket.set(bucketKey, items);
  }

  // Attach children to parent items
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
  const { t } = useI18n();

  const routes = computed((): NavSource[] => routeSources(router.getRoutes()));

  const scenarios = computed((): LabEntry[] => scenarioEntries(t));

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
        icon: "folder",
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
            icon: source.nav.icon ?? SCENARIO_ICON,
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
        icon: get(FAMILY_CONFIG, name, FALLBACK_FAMILY_ICON),
        entries
      })),
      "label"
    )
  );

  return { composables, families, navigation };
}
