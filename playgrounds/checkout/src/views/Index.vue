<template>
  <article
    class="view prose flex min-h-full w-full max-w-screen-xl flex-col bg-base px-4 py-8 text-base-content sm:px-6 lg:px-6"
  >
    <h1 class="m-0 w-full">Buttons</h1>

    <h3 class="mt-8 w-full">Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="flat" label="Flat Button"></upw-button>
      <upw-button variant="elevated" label="Elevated Button"></upw-button>
      <upw-button variant="outlined" label="Outlined Button"></upw-button>
      <upw-button variant="plain" label="Plain Button"></upw-button>
      <upw-button variant="ghost" label="Ghost Button"></upw-button>
      <upw-button variant="link" label="Link Button"></upw-button>
    </div>

    <h3 class="mt-8 w-full">Size Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button size="xs" label="Xtra Small Button"></upw-button>
      <upw-button size="sm" label="Small Button"></upw-button>
      <upw-button size="md" label="Medium Button"></upw-button>
      <upw-button size="lg" label="Large Button"></upw-button>
      <upw-button size="xl" label="Xtra Large Button"></upw-button>
    </div>

    <h3 class="mt-8 w-full">Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button color="primary" label="Primary Button"></upw-button>
      <upw-button color="secondary" label="Secondary Button"></upw-button>
      <upw-button color="accent" label="Accent Button"></upw-button>
      <upw-button color="neutral" label="Neutral Button"></upw-button>
      <upw-button color="info" label="Info Button"></upw-button>
      <upw-button color="success" label="Success Button"></upw-button>
      <upw-button color="error" label="Error Button"></upw-button>
      <upw-button color="warning" label="Warning Button"></upw-button>
    </div>

    <h3 class="mt-8 w-full">Shape Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button shape="none" label="No Shaped Button"></upw-button>
      <upw-button shape="sm" label="Small Shaped Button"></upw-button>
      <upw-button shape="md" label="Medium Shaped Button"></upw-button>
      <upw-button shape="lg" label="Large Shaped Button"></upw-button>
      <upw-button shape="xl" label="Xtra Large Shaped Button"></upw-button>
      <upw-button shape="pill" label="Pill Shaped Button"></upw-button>
      <!--  -->
      <upw-button
        shape="icon"
        icon="cog"
        size="xs"
        label="Icon Only Button"
      ></upw-button>
      <upw-button
        shape="icon"
        icon="cog"
        size="sm"
        label="Icon Only Button"
      ></upw-button>
      <upw-button shape="icon" icon="cog" label="Icon Only Button"></upw-button>
      <upw-button
        shape="icon"
        icon="cog"
        size="lg"
        label="Icon Only Button"
      ></upw-button>
      <upw-button
        shape="icon"
        icon="cog"
        size="xl"
        label="Icon Only Button"
      ></upw-button>
    </div>
  </article>
</template>

<script setup>
import { UpwButton } from "@upmind/upwind";
</script>
