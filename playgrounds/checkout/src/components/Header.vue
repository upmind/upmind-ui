<template>
  <header
    class="flex w-full flex-wrap border-b border-base-300 bg-base px-4 py-3 text-sm text-base-content sm:flex-nowrap sm:justify-start sm:px-6 lg:px-20"
  >
    <nav
      class="relative mx-auto flex w-full max-w-screen-2xl flex-row flex-wrap items-center justify-start gap-4 sm:flex sm:items-center sm:justify-between"
      aria-label="Global"
    >
      <component
        :is="noHome ? 'a' : 'router-link'"
        class="flex h-10 w-auto items-center justify-between gap-3 text-xl font-semibold"
        to="/"
        aria-label="Brand"
      >
        <picture class="h-full w-full">
          <source srcset="/logo.png" type="image/png" />
          <img src="/logo.svg" class="h-full w-full" />
          <caption class="sr-only text-nowrap tracking-widest">
            {{
              $t("header.title")
            }}
          </caption>
        </picture>

        <!-- <img src="/logo.svg" class="h-full w-full" /> -->
      </component>

      <div class="flex flex-1 items-center justify-end gap-4">
        <upw-listbox
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

        <upm-currency />

        <upw-button
          to="/"
          class="relative"
          append-icon="basket"
          color="base"
          variant="ghost"
        >
          <template #append-avatar>
            <upw-avatar
              :key="items?.length"
              v-if="items?.length"
              class="animate-once absolute -top-1 right-0 size-4 animate-ping bg-secondary text-xs text-secondary-content"
            >
              {{ items.length }}
            </upw-avatar>
          </template>
        </upw-button>

        <upm-profile />
      </div>
    </nav>
  </header>
</template>

<script>
import { defineComponent } from "vue";
import {
  useBasket,
  UpwListbox,
  UpmProfile,
  UpmCurrency,
  UpwAvatar,
  UpwButton,
} from "@upmind/client-vue";

export default defineComponent({
  name: "UpmHeader",
  components: {
    UpwAvatar,
    UpwListbox,
    UpwButton,
    UpmProfile,
    UpmCurrency,
  },
  props: {
    noHome: {
      type: Boolean,
      default: false,
    },
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
