<template>
  <header
    class="flex w-full flex-wrap border-b border-gray-200 bg-base py-3 text-sm text-base-content sm:flex-nowrap sm:justify-start"
  >
    <nav
      class="relative mx-auto flex w-full flex-wrap items-center gap-4 px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-20"
      aria-label="Global"
    >
      <router-link
        class="flex h-10 w-auto items-center justify-between gap-3 text-xl font-semibold"
        to="/"
        aria-label="Brand"
      >
        <logo class="h-full w-full" />
        <span class="text-nowrap tracking-widest">{{
          $t("header.title")
        }}</span>
      </router-link>

      <div class="flex flex-1 items-center justify-end gap-8">
        <upw-listbox
          v-if="$i18n?.locale && locales.length >= 1"
          size="sm"
          v-model="$i18n.locale"
          :label="$i18n.locale?.toUpperCase()"
          :prepend-avatar="{
            path: 'flags',
            name: $i18n.locale.toLowerCase(),
          }"
          :items="locales"
        />

        <upm-currency />

        <RouterLink
          to="/checkout"
          class="relative inline-flex items-center gap-2 pr-3 text-base-700 hover:text-base-content"
          exactActiveClass="text-primary underline"
        >
          <upw-avatar
            :key="items?.length"
            v-if="items?.length"
            class="animate-once absolute -top-2 right-0 size-4 animate-ping bg-primary text-xs text-primary-content"
          >
            {{ items.length }}
          </upw-avatar>

          <upw-icon icon="basket" size="sm" />

          <span class="sr-only">{{ $t("header.checkout") }}</span>
        </RouterLink>

        <upm-profile />
      </div>
    </nav>
  </header>
</template>

<script>
import { defineComponent } from "vue";
import Logo from "@/assets/logo.svg";
import {
  useBasket,
  UpwListbox,
  UpmProfile,
  UpmCurrency,
  UpwAvatar,
  UpwIcon,
} from "@upmind/client-vue";

export default defineComponent({
  name: "UpmHeader",
  components: {
    Logo,
    UpwAvatar,
    UpwIcon,
    UpwListbox,
    UpmProfile,
    UpmCurrency,
  },
  setup() {
    const { items } = useBasket();

    return {
      items,
    };
  },
  computed: {
    locales() {
      return this.$i18n.availableLocales.map(locale => ({
        label: locale.toUpperCase(),
        value: locale,
        prependAvatar: {
          path: "flags",
          name: locale,
        },
      }));
    },
  },
});
</script>

<style scoped lang="scss">
.animate-once {
  animation-iteration-count: 1 !important;
}
</style>
