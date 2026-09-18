<template>
  <Button
    v-if="store"
    variant="outline"
    size="sm"
    :as="store.as"
    :to="store.to"
    :href="store.href"
    data-test-key="logged-out-store"
  >
    <ShoppingBasket />
    Place new order
  </Button>
</template>

<script setup lang="ts">
// The store shortcut. The cart's LTR header sets `items: end`, so it sits at the
// top of the aside, opposite the wordmark.
import { Button } from "@upmind/ui";
import { ShoppingBasket } from "lucide-vue-next";
import { computed } from "vue";
import { NuxtLink } from "#components";
import { useMockBrandGates } from "~/portal/mock/gates";

const { storeShortcut } = useMockBrandGates();

/** As the primitive's polymorphic `as` needs it: an in-app link or a plain anchor. */
const store = computed(() => {
  const shortcut = storeShortcut.value;
  if (shortcut === undefined) return undefined;
  if ("href" in shortcut) {
    return { as: "a", href: shortcut.href, to: undefined };
  }
  return { as: NuxtLink, href: undefined, to: shortcut.to };
});
</script>
