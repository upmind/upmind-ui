// -----------------------------------------------------------------------------
/**
 * @module composables/useNavigation
 * @description The playground's ONE navigation derivation. Two declarative
 * sources feed the same tree — a route's `meta.nav` (the `useAuth` precedent)
 * and the scenario contract (`factory/registry`, ruling S-D4) — so a module
 * reaching the factory as a registry entry appears in the sidebar AND on the
 * landing page with neither hand-edited.
 */

import { computed } from "vue";
import { useRouter, type RouteRecordNormalized } from "vue-router";
import { registry, scenarioKeys } from "./factory/registry";
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

// -----------------------------------------------------------------------------

export interface NavMeta {
  label: string;
  icon?: string;
  section?: string; // e.g., "Labs", "Portal", "Admin"
  order?: number; // Sort order within section
  hidden?: boolean; // Hide from nav (for dynamic routes like :id)
  parent?: string; // Parent route name for nesting
}

export interface NavItem {
  label: string;
  icon?: string;
  /** A named route record. */
  route?: string;
  /** A path, for an item the registry declares rather than a route record. */
  to?: string;
  dynamic?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  icon?: string;
  order: number;
  children: NavItem[];
}

/** One composable a developer can open, whichever source declared it. */
export interface LabEntry {
  key: string;
  label: string;
  icon: string;
  family: string;
  route?: string;
  to?: string;
  tags: string[];
}

/** Entries sharing a natural family — `client` owns email, phone, address… */
export interface LabFamily {
  name: string;
  label: string;
  icon: string;
  entries: LabEntry[];
}

type NavSource = { nav: NavMeta; route?: string; to?: string };

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

const SCENARIO_ENTRIES: LabEntry[] = map(scenarioKeys, key => ({
  key,
  label: startCase(key),
  icon: SCENARIO_ICON,
  family: familyOf(key),
  to: `/scenarios/${key}/as/${get(registry, [key, "scope", "actor"])}`,
  tags: compact(
    map(keys(get(registry, key)), field => get(BINDING_TAGS, field))
  )
}));

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

  const routes = computed((): NavSource[] => routeSources(router.getRoutes()));

  const navigation = computed((): NavItem[] => {
    const sectionMap = buildNavigationTree([
      ...routes.value,
      ...map(SCENARIO_ENTRIES, entry => ({
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
        ...SCENARIO_ENTRIES
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

// Re-export NavItem type for use in components
export type { NavItem as NavItemType };
