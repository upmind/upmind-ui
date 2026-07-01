<template>
  <div class="p-8">
    <div class="mb-12">
      <h1 class="text-display text-4xl font-bold">Welcome to Upmind Labs</h1>
      <p class="text-muted mt-4 text-lg">
        A playground for testing Upmind components, APIs, and utilities. Explore
        the sidebar to navigate to different experiments.
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="mb-12 grid grid-cols-3 gap-6">
      <div class="bg-surface border-surface card-radius border p-6">
        <div class="flex items-center gap-3">
          <div
            class="bg-accent-info-muted text-accent-info flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <Icon icon="beaker-01" size="sm" />
          </div>
          <div>
            <p class="text-display text-2xl font-bold">
              {{ labsCount }}
            </p>
            <p class="text-muted text-sm">Lab Experiments</p>
          </div>
        </div>
      </div>
      <div class="bg-surface border-surface card-radius border p-6">
        <div class="flex items-center gap-3">
          <div
            class="bg-accent-success-muted text-accent-success flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <Icon icon="user-01" size="sm" />
          </div>
          <div>
            <p class="text-display text-2xl font-bold">
              {{ composablesCount }}
            </p>
            <p class="text-muted text-sm">Composable Pages</p>
          </div>
        </div>
      </div>
      <div class="bg-surface border-surface card-radius border p-6">
        <div class="flex items-center gap-3">
          <div
            class="bg-accent-promo-muted text-accent-promo flex h-10 w-10 items-center justify-center rounded-lg"
          >
            <Icon icon="shield-01" size="sm" />
          </div>
          <div>
            <p class="text-display text-2xl font-bold">
              {{ totalCount }}
            </p>
            <p class="text-muted text-sm">Total Pages</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="mb-12">
      <h2 class="text-display mb-6 text-2xl font-semibold">Quick Links</h2>
      <div class="grid grid-cols-2 gap-4">
        <NuxtLink
          v-for="link in quickLinks"
          :key="link.route"
          :to="{ name: link.route }"
          class="bg-surface border-surface hover:border-accent-primary card-radius group flex items-center gap-4 border p-4 transition-all hover:shadow-md"
        >
          <div
            class="bg-canvas text-muted group-hover:bg-accent-primary-muted group-hover:text-accent-primary flex h-12 w-12 items-center justify-center rounded-lg transition-colors"
          >
            <Icon :icon="link.icon" size="md" />
          </div>
          <div>
            <h3 class="text-display font-medium">
              {{ link.label }}
            </h3>
            <p class="text-muted text-sm">
              {{ link.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Getting Started -->
    <div class="bg-accent-primary-muted border-surface card-radius border p-8">
      <h2 class="text-display mb-4 text-2xl font-semibold">Getting Started</h2>
      <p class="mb-6 text-base">
        Use the sidebar navigation to explore different components and
        experiments. Each section contains interactive demos and examples.
      </p>
      <div class="flex gap-4">
        <Button color="primary" @click="handleNavigate('useAuth')">
          <Icon icon="lock-01" size="xs" class="mr-2" />
          Try Auth
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { useNavigation, type NavItem } from "~/composables/useNavigation";
// -----------------------------------------------------------------------------

definePageMeta({
  name: "home",
  nav: {
    label: "Home",
    icon: "home-01",
    section: "Composables",
    order: 0,
    hidden: true
  }
});

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
  return navigation.value
    .filter((n: NavItem) => n.label !== "Composables")
    .reduce((acc: number, item: NavItem) => {
      if (item.route) acc++;
      if (item.children) acc += countRoutes(item.children);
      return acc;
    }, 0);
});

const composablesCount = computed(() => {
  const composables = navigation.value.find(
    (n: NavItem) => n.label === "Composables"
  );
  return countRoutes(composables?.children || []);
});

const totalCount = computed(() => {
  return navigation.value.reduce((acc: number, item: NavItem) => {
    if (item.route) acc++;
    if (item.children) acc += countRoutes(item.children);
    return acc;
  }, 0);
});

const quickLinks = [
  {
    label: "useAuth Playground",
    description: "Test login, register, recover, and 2FA flows",
    route: "useAuth",
    icon: "lock-01"
  }
];

const handleNavigate = (routeName: string) => {
  router.push({ name: routeName });
};
</script>
