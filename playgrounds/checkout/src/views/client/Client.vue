<template>
  <section class="client w-full">
    <header
      class="flex w-full flex-wrap border-b border-gray-200 bg-base py-3 text-sm text-base-content sm:flex-nowrap sm:justify-start"
    >
      <nav
        class="relative mx-auto flex w-full flex-wrap items-end gap-4 sm:flex sm:justify-between"
      >
        <h1 class="m-0 text-nowrap tracking-widest">
          {{ $t("client.title") }}
        </h1>

        <div class="flex items-center justify-end gap-4">
          <RouterLink
            to="/client"
            class="hover:underline"
            exactActiveClass="text-primary underline"
          >
            {{ $t("client.nav.home") }}
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
        <!-- #END TEMP -->
      </nav>
    </header>

    <router-view />
  </section>
</template>
