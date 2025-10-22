<template>
  <div
    class="flex min-h-screen w-full flex-col items-center justify-center p-5 lg:py-24"
  >
    <div class="max-w-app w-full">
      <!-- Header -->
      <header class="w-full">
        <slot name="header-left" />
      </header>

      <Card
        as="article"
        class="bg-surface card-radius my-9 flex w-full flex-col justify-between gap-12 lg:flex-row lg:gap-32"
        spacious
      >
        <!-- Content Header -->
        <section class="w-app-aside w-full">
          <slot name="content-header" />
        </section>

        <!-- Content -->
        <section class="w-full">
          <slot name="content" />
          <slot name="default" />
        </section>
      </Card>

      <!-- Footer -->
      <footer
        class="flex w-full flex-col items-center gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-0"
      >
        <slot name="footer-content" />
        <slot name="footer-copyright" />
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- components
import Card from "../card/Card.ce.vue";
</script>
