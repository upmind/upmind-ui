<template>
  <section class="client w-full">
    <header class="flex w-full flex-wrap">
      <nav
        class="relative mx-auto flex w-full flex-wrap items-end gap-4 sm:flex sm:justify-between"
      >
        <h1 class="m-0 text-nowrap">
          {{ $t("client.title") }}
        </h1>

        <div class="flex items-center justify-end gap-4 text-sm">
          <RouterLink
            to="/client"
            class="hover:underline"
            exactActiveClass="text-primary underline"
          >
            {{ $t("client.nav.basket") }}
          </RouterLink>

          <RouterLink
            to="/client/addresses"
            class="hover:underline"
            exactActiveClass="text-primary underline"
          >
            {{ $t("client.nav.addresses") }}
          </RouterLink>

          <RouterLink
            to="/client/emails"
            class="hover:underline"
            exactActiveClass="text-primary underline"
          >
            {{ $t("client.nav.emails") }}
          </RouterLink>

          <RouterLink
            to="/client/phones"
            class="hover:underline"
            exactActiveClass="text-primary underline"
          >
            {{ $t("client.nav.phones") }}
          </RouterLink>

          <RouterLink
            to="/client/companies"
            class="hover:underline"
            exactActiveClass="text-primary underline"
          >
            {{ $t("client.nav.companies") }}
          </RouterLink>
        </div>
      </nav>
    </header>

    <router-view class="child-view flex-1 gap-4 py-8" />
  </section>
</template>

<script>
import { defineComponent } from "vue";
import { getLocalMessages } from "@/utils";

export default defineComponent({
  name: "Client",
  i18n: {
    messages: getLocalMessages("client"),
  },
});
</script>
