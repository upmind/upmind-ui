<template>
  <div class="p-8">
    <UpmLayout>
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
              <Icon icon="beaker-01" size="sm" />
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
              <Icon icon="user-01" size="sm" />
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
              <Icon icon="shield-01" size="sm" />
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
            class="hover:border-primary-500 dark:hover:border-primary-500 group flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
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
        class="from-primary-50 dark:from-primary-950 rounded-xl border border-neutral-200 bg-linear-to-br to-blue-50 p-8 dark:border-neutral-800 dark:to-blue-950"
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
            <Icon icon="shopping-bag-02" size="xs" class="mr-2" />
            View Products
          </Button>
        </div>
      </div>
    </UpmLayout>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { useNavigation, type NavItem } from "../composables/useNavigation";

// -----------------------------------------------------------------------------

const router = useRouter();
const { navigation } = useNavigation();

// Count routes in each section
const countRoutes = (items: NavItem[]): number => {
  return items.reduce((acc, item) => {
    if (item.route) acc++;
    if (item.children) acc += countRoutes(item.children);
    return acc;
  }, 0);
};

const labsCount = computed(() => {
  // Count top-level lab items: Brand, Places, Feedback, Forms, Client Management, Products
  const labItems = [
    "Brand",
    "Places API",
    "Feedback",
    "Forms",
    "Client Management",
    "Products"
  ];
  return navigation.value
    .filter((n: NavItem) => labItems.includes(n.label))
    .reduce((acc: number, item: NavItem) => {
      if (item.route) acc++;
      if (item.children) acc += countRoutes(item.children);
      return acc;
    }, 0);
});

const portalCount = computed(() => {
  const portal = navigation.value.find((n: NavItem) => n.label === "Portal");
  const session = navigation.value.find((n: NavItem) => n.label === "Session");
  return (
    countRoutes(portal?.children || []) + countRoutes(session?.children || [])
  );
});

const adminCount = computed(() => {
  const admin = navigation.value.find((n: NavItem) => n.label === "Admin");
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
    icon: "marker-pin-01"
  },
  {
    label: "Products Catalogue",
    description: "Browse products",
    route: "products.catalogue",
    icon: "shopping-bag-02"
  },
  {
    label: "Feedback",
    description: "Feedback management",
    route: "feedback",
    icon: "message-chat-circle"
  }
];

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};
</script>
