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
          v-model="$i18n.locale"
          v-if="$i18n?.locale"
          :label="$i18n.locale?.toUpperCase()"
          :avatar="{
            path: 'flags',
            name: $i18n.locale,
          }"
          :items="locales"
        />
      </div>

      <div class="flex items-center justify-end gap-4">
        <RouterLink
          to="/"
          class="hover:underline"
          activeClass="text-primary-500"
          exactActiveClass="text-primary-700 underline"
        >
          {{ $t("header.checkout") }}
        </RouterLink>
        <RouterLink
          to="/offers"
          class="hover:underline"
          activeClass="text-primary-500"
          exactActiveClass="text-primary-700 underline"
        >
          {{ $t("header.offers") }}
        </RouterLink>
        <RouterLink
          to="/session"
          class="hover:underline"
          activeClass="text-primary-500"
          exactActiveClass="text-primary-700 underline"
        >
          {{ $t("header.session") }}
        </RouterLink>
      </div>
      <!-- #END TEMP -->
    </nav>
  </header>
</template>

<script>
import { defineComponent } from "vue";
import Logo from "@/assets/logo.svg";
import { UpwListbox } from "@upmind/client";

export default defineComponent({
  name: "UpmHeader",
  components: {
    Logo,
    UpwListbox,
  },
  computed: {
    locales() {
      return this.$i18n.availableLocales.map(locale => ({
        label: locale.toUpperCase(),
        value: locale,
        avatar: {
          path: "flags",
          name: locale,
        },
      }));
    },
  },
});
</script>
