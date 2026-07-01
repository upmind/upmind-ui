// Navigation composable - auto-generates navigation from router routes
// Each route should have meta.nav to appear in the sidebar

import { computed } from "vue";
import { useRouter, type RouteRecordNormalized } from "vue-router";

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
  route?: string;
  dynamic?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  label: string;
  icon?: string;
  order: number;
  children: NavItem[];
}

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

// --- Helper Functions
function getNavMeta(route: RouteRecordNormalized): NavMeta | undefined {
  return route.meta?.nav as NavMeta | undefined;
}

function buildNavItem(route: RouteRecordNormalized): NavItem | null {
  const nav = getNavMeta(route);
  if (!nav || nav.hidden) return null;

  return {
    label: nav.label,
    icon: nav.icon,
    route: route.name as string,
    dynamic: false
  };
}

function buildNavigationTree(
  routes: RouteRecordNormalized[]
): Map<string, NavItem[]> {
  const sectionMap = new Map<string, NavItem[]>();
  const childMap = new Map<string, NavItem[]>(); // parent route name -> children

  // First pass: collect all nav items
  const navItems: Array<{ route: RouteRecordNormalized; nav: NavMeta }> = [];

  for (const route of routes) {
    const nav = getNavMeta(route);
    if (nav && !nav.hidden) {
      navItems.push({ route, nav });
    }
  }

  // Sort by order
  navItems.sort((a, b) => (a.nav.order ?? 99) - (b.nav.order ?? 99));

  // Second pass: build tree structure
  for (const { route, nav } of navItems) {
    const item = buildNavItem(route);
    if (!item) continue;

    if (nav.parent) {
      // This is a child item
      const children = childMap.get(nav.parent) || [];
      children.push(item);
      childMap.set(nav.parent, children);
    } else {
      // This is a top-level item in a section
      const section = nav.section || "Other";
      const items = sectionMap.get(section) || [];
      items.push(item);
      sectionMap.set(section, items);
    }
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

  const navigation = computed((): NavItem[] => {
    const routes = router.getRoutes();
    const sectionMap = buildNavigationTree(routes);

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
        for (const item of items) {
          result.push(item);
        }
      } else {
        sections.push({
          label: sectionName,
          icon: config.icon,
          order: config.order,
          children: items
        });
      }
    }

    // Sort sections by order and add to result
    sections.sort((a, b) => a.order - b.order);

    // Add top-level Labs items first (already in result), then sections
    for (const section of sections) {
      result.push({
        label: section.label,
        icon: section.icon,
        children: section.children
      });
    }

    return result;
  });

  return { navigation };
}

// Re-export NavItem type for use in components
export type { NavItem as NavItemType };
