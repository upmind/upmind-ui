<template>
  <Button
    v-if="store"
    variant="outline"
    size="sm"
    :as="store.as"
    :to="store.to"
    :href="store.href"
    :data-attrs="{ 'data-test-key': 'logged-out-store' }"
  >
    <Icon icon="basket" />
    Place new order
  </Button>
</template>

<script setup lang="ts">
import { Button } from "@upmind/ui";
import { computed } from "vue";
import { Icon } from "@upmind-automation/foundation";
import { isUndefined } from "lodash-es";
import { NuxtLink } from "#components";
import { useMockBrandGates } from "~/portal/mock/gates";

const { storeShortcut } = useMockBrandGates();

const store = computed(() => {
  const shortcut = storeShortcut.value;
  if (isUndefined(shortcut)) return undefined;
  if ("href" in shortcut) {
    return { as: "a", href: shortcut.href, to: undefined };
  }
  return { as: NuxtLink, href: undefined, to: shortcut.to };
});
</script>
