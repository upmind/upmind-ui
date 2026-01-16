<template>
  <div class="bg-surface flex min-h-screen">
    <!-- Left Sidebar -->
    <aside
      class="fixed top-0 left-0 z-40 h-screen w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <!-- Logo / Header -->
      <div
        class="flex h-16 items-center border-b border-neutral-200 px-4 dark:border-neutral-800"
      >
        <div class="flex items-center gap-2">
          <div
            class="bg-primary-500 flex h-8 w-8 items-center justify-center rounded-lg text-white"
          >
            <Icon icon="beaker" size="sm" />
          </div>
          <span class="text-lg font-semibold text-neutral-900 dark:text-white"
            >Upmind Labs</span
          >
        </div>
      </div>

      <!-- Navigation -->
      <nav class="h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <ul class="space-y-1">
          <li v-for="(item, index) in navigation" :key="index">
            <NavSection :item="item" :depth="0" />
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="ml-64 flex-1 p-8">
      <div class="mx-auto max-w-4xl">
        <!-- Hero Section -->
        <div class="mb-12">
          <h1 class="text-4xl font-bold text-neutral-900 dark:text-white">
            Welcome to Upmind Labs
          </h1>
          <p class="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
            A playground for testing Upmind components, APIs, and utilities.
            Explore the sidebar to navigate to different experiments.
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="mb-12 grid grid-cols-3 gap-6">
          <div
            class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
              >
                <Icon icon="beaker" size="sm" />
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white">
                  {{ labsCount }}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Lab Experiments
                </p>
              </div>
            </div>
          </div>
          <div
            class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
              >
                <Icon icon="user" size="sm" />
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white">
                  {{ portalCount }}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Portal Pages
                </p>
              </div>
            </div>
          </div>
          <div
            class="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
              >
                <Icon icon="shield" size="sm" />
              </div>
              <div>
                <p class="text-2xl font-bold text-neutral-900 dark:text-white">
                  {{ adminCount }}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Admin Pages
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="mb-12">
          <h2
            class="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white"
          >
            Quick Links
          </h2>
          <div class="grid grid-cols-2 gap-4">
            <RouterLink
              v-for="link in quickLinks"
              :key="link.route"
              :to="{ name: link.route }"
              class="group hover:border-primary-500 dark:hover:border-primary-500 flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div
                class="group-hover:bg-primary-100 group-hover:text-primary-600 dark:group-hover:bg-primary-900 dark:group-hover:text-primary-400 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 transition-colors dark:bg-neutral-800 dark:text-neutral-400"
              >
                <Icon :icon="link.icon" size="md" />
              </div>
              <div>
                <h3 class="font-medium text-neutral-900 dark:text-white">
                  {{ link.label }}
                </h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ link.description }}
                </p>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Getting Started -->
        <div
          class="from-primary-50 dark:from-primary-950 rounded-xl border border-neutral-200 bg-gradient-to-br to-blue-50 p-8 dark:border-neutral-800 dark:to-blue-950"
        >
          <h2
            class="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white"
          >
            Getting Started
          </h2>
          <p class="mb-6 text-neutral-700 dark:text-neutral-300">
            Use the sidebar navigation to explore different components and
            experiments. Each section contains interactive demos and examples.
          </p>
          <div class="flex gap-4">
            <Button color="primary" @click="navigateTo('brand')">
              <Icon icon="palette" size="xs" class="mr-2" />
              Explore Brand
            </Button>
            <Button variant="outline" @click="navigateTo('products.catalogue')">
              <Icon icon="package" size="xs" class="mr-2" />
              View Products
            </Button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, h } from "vue";
import { RouterLink, useRouter } from "vue-router";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";

// --- internal
import { navigation, type NavItem } from "./navigation";

// -----------------------------------------------------------------------------

const router = useRouter();

// Count routes in each section
const countRoutes = (items: NavItem[]): number => {
  return items.reduce((acc, item) => {
    if (item.route) acc++;
    if (item.children) acc += countRoutes(item.children);
    return acc;
  }, 0);
};

const labsCount = computed(() => {
  const labs = navigation.find(n => n.label === "Labs");
  const clientMgmt = navigation.find(n => n.label === "Client Management");
  const products = navigation.find(n => n.label === "Products");
  return (
    countRoutes(labs?.children || []) +
    countRoutes(clientMgmt?.children || []) +
    countRoutes(products?.children || [])
  );
});

const portalCount = computed(() => {
  const portal = navigation.find(n => n.label === "Portal");
  const session = navigation.find(n => n.label === "Session");
  return (
    countRoutes(portal?.children || []) + countRoutes(session?.children || [])
  );
});

const adminCount = computed(() => {
  const admin = navigation.find(n => n.label === "Admin Portal");
  return countRoutes(admin?.children || []);
});

const quickLinks = [
  {
    label: "Brand Playground",
    description: "Test brand components",
    route: "brand",
    icon: "palette"
  },
  {
    label: "Places API",
    description: "Google Places integration",
    route: "places",
    icon: "map-pin"
  },
  {
    label: "Products Catalogue",
    description: "Browse products",
    route: "products.catalogue",
    icon: "package"
  },
  {
    label: "Feedback",
    description: "Feedback management",
    route: "feedback",
    icon: "message-square"
  }
];

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};

// NavSection component for recursive rendering
const NavSection = {
  name: "NavSection",
  props: {
    item: { type: Object as () => NavItem, required: true },
    depth: { type: Number, default: 0 }
  },
  setup(props: { item: NavItem; depth: number }) {
    const router = useRouter();
    const route = useRoute();

    // Check if any child route is currently active
    const hasActiveChild = (item: NavItem): boolean => {
      if (item.route && route.name === item.route) {
        return true;
      }
      if (item.children) {
        return item.children.some(child => hasActiveChild(child));
      }
      return false;
    };

    // Start collapsed by default, but expand if contains active route
    const isOpen = ref(hasActiveChild(props.item));

    // Watch for route changes to auto-expand when navigating
    watch(
      () => route.name,
      () => {
        if (hasActiveChild(props.item)) {
          isOpen.value = true;
        }
      }
    );

    const toggle = () => {
      if (props.item.children) {
        isOpen.value = !isOpen.value;
      }
    };

    const hasChildren = computed(
      () => props.item.children && props.item.children.length > 0
    );
    const paddingLeft = computed(() => `${props.depth * 12 + 8}px`);

    return () => {
      const item = props.item;
      const depth = props.depth;

      if (hasChildren.value) {
        // Parent item with children
        return h("div", {}, [
          h(
            "button",
            {
              class: [
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                depth === 0 ? "text-neutral-900 dark:text-white" : ""
              ],
              style: { paddingLeft: paddingLeft.value },
              onClick: toggle
            },
            [
              item.icon
                ? h(Icon, {
                    icon: item.icon,
                    size: "xs",
                    class: "shrink-0 text-neutral-500"
                  })
                : null,
              h("span", { class: "flex-1" }, item.label),
              h(Icon, {
                icon: isOpen.value ? "chevron-down" : "chevron-right",
                size: "2xs",
                class: "shrink-0 text-neutral-400"
              })
            ]
          ),
          isOpen.value
            ? h(
                "ul",
                { class: "mt-1 space-y-1" },
                item.children!.map((child, idx) =>
                  h("li", { key: idx }, [
                    h(NavSection, { item: child, depth: depth + 1 })
                  ])
                )
              )
            : null
        ]);
      } else if (item.route) {
        // Leaf item with route
        if (item.dynamic) {
          // Dynamic route - non-navigable, just a label
          return h(
            "div",
            {
              class: [
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                "text-neutral-400 dark:text-neutral-600",
                "cursor-default"
              ],
              style: { paddingLeft: paddingLeft.value }
            },
            [
              h(Icon, {
                icon: "hash",
                size: "2xs",
                class: "shrink-0 text-neutral-300 dark:text-neutral-700"
              }),
              h("span", { class: "italic" }, item.label)
            ]
          );
        }

        // Regular navigable route
        return h(
          RouterLink,
          {
            to: { name: item.route },
            class: [
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            ],
            style: { paddingLeft: paddingLeft.value },
            activeClass:
              "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400"
          },
          () => [
            item.icon
              ? h(Icon, {
                  icon: item.icon,
                  size: "xs",
                  class: "shrink-0 text-neutral-500"
                })
              : null,
            h("span", {}, item.label)
          ]
        );
      }

      return null;
    };
  }
};
</script>
