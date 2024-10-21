<template>
  <header
    class="flex w-full flex-wrap border-b bg-base px-4 py-3 text-sm text-base-foreground sm:flex-nowrap sm:justify-start sm:px-6 lg:px-20"
  >
    <nav
      class="relative mx-auto flex w-full max-w-screen-2xl flex-row flex-wrap items-center justify-start gap-4 sm:flex sm:items-center sm:justify-between"
      aria-label="Global"
    >
      <component
        :is="props.noHome ? 'a' : 'router-link'"
        class="flex h-10 w-auto items-center justify-between gap-3 text-xl font-semibold"
        to="/"
        aria-label="Brand"
      >
        <picture class="h-full w-full">
          <source srcset="/logo.png" type="image/png" />
          <img src="/logo.svg" class="h-full w-auto" />
          <span class="sr-only text-nowrap tracking-widest">
            {{ t("header.title") }}
          </span>
        </picture>
      </component>

      <div class="flex flex-1 items-center justify-end gap-4">
        <UpwListbox
          v-if="$i18n?.locale && locales.length > 1"
          size="sm"
          v-model="$i18n.locale"
          :label="$i18n.locale?.toUpperCase()"
          :prepend-avatar="{
            path: 'flags',
            name: $i18n.locale.toLowerCase(),
          }"
          :items="locales"
        />

        <UpmCurrency />

        <router-link
          to="/"
          custom
          v-slot="{ href, navigate }"
          v-if="!isBasketView"
        >
          <Button
            :href="meta.isAvailable ? href : null"
            @click="meta.isAvailable && navigate"
            :as="meta.isAvailable ? (href ? 'a' : 'button') : 'button'"
            :disabled="!meta.isAvailable"
            variant="ghost"
          >
            <Icon icon="basket" slot="prepend" size="xs" />
            <Indicator
              slot="append"
              :key="items?.length"
              :modelValue="items.length"
              color="primary"
              class="absolute right-0 top-0"
            >
            </Indicator>
          </Button>
        </router-link>

        <UpmProfile />
      </div>
    </nav>
  </header>
</template>

<script lang="ts" setup>
import {
  useBasket,
  UpwListbox,
  UpmProfile,
  UpmCurrency,
} from "@upmind/client-vue";

import { Icon, Indicator, Button } from "@upmind/upwind";

const props = defineProps<{
  noHome?: boolean;
}>();

const { meta, items } = useBasket();

const isBasketView = computed(() => {
  return this.$route.name === "basket";
});

const locales = computed(() => {
  return this.$i18n.availableLocales.map(locale => ({
    label: locale.toUpperCase(),
    value: locale,
    prependAvatar: {
      path: "flags",
      name: locale,
    },
  }));
});
</script>

<style scoped lang="scss">
.animate-once {
  animation-iteration-count: 1 !important;
}
</style>
