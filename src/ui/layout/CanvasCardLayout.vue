<template>
  <div class="flex min-h-screen w-full flex-col items-center justify-center">
    <div class="max-w-app w-full">
      <!-- Header -->
      <header class="w-full">
        <slot name="header-left" />
      </header>

      <article
        class="bg-surface card-radius my-9 flex w-full justify-between gap-32 p-18"
      >
        <!-- Content Header -->
        <section class="w-app-aside">
          <slot name="content-header" />
        </section>

        <!-- Content -->
        <section class="w-full">
          <slot name="content" />
          <slot name="default" />
        </section>
      </article>

      <!-- Footer -->
      <footer class="flex w-full items-start justify-between">
        <slot name="footer-content" />
        <slot name="footer-copyright" />
      </footer>
    </div>
  </div>
</template>
