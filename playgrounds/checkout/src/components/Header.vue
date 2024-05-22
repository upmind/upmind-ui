<template>
  <header
    class="flex w-full flex-wrap border-b border-gray-200 bg-base py-3 text-sm text-base-content sm:flex-nowrap sm:justify-start"
  >
    <nav
      class="relative mx-auto flex w-full flex-wrap items-center gap-4 px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-20"
      aria-label="Global"
    >
      <a
        class="flex h-10 w-auto items-center justify-between gap-3 text-xl font-semibold"
        href="/"
        aria-label="Brand"
      >
        <logo class="h-full w-full" />
        <span class="text-nowrap tracking-widest">{{
          $t("header.title")
        }}</span>
      </a>

      <!-- TEMP -->
      <div class="flex flex-1 items-center justify-start gap-4">
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
      </div>

      <div class="flex items-center justify-end gap-4">
        <RouterLink
          to="/checkout"
          class="hover:underline"
          exactActiveClass="text-primary underline"
        >
          {{ $t("header.checkout") }}
        </RouterLink>
        <RouterLink
          to="/offers"
          class="hover:underline"
          exactActiveClass="text-primary underline"
        >
          {{ $t("header.offers") }}
        </RouterLink>
        <RouterLink
          to="/session"
          class="hover:underline"
          exactActiveClass="text-primary underline"
        >
          {{ $t("header.session") }}
        </RouterLink>
        <RouterLink
          to="/client"
          class="hover:underline"
          exactActiveClass="text-primary underline"
        >
          {{ $t("header.client") }}
        </RouterLink>
      </div>
      <!-- #END TEMP -->

      <upm-currency />
      <upm-profile />
    </nav>
  </header>
</template>

<script>
import { defineComponent } from "vue";
import Logo from "@/assets/logo.svg";
import { UpwListbox, UpmProfile, UpmCurrency } from "@upmind/client";

export default defineComponent({
  name: "UpmHeader",
  components: {
    Logo,
    UpwListbox,
    UpmProfile,
    UpmCurrency,
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
