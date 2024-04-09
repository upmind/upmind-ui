<template>
  <div
    class="prose mx-auto flex max-w-none flex-wrap place-content-start items-start justify-start gap-4 p-8"
  >
    <section class="flex w-full flex-wrap items-center gap-4">
      <h3 class="w-full">Type Variants</h3>
      <upw-dropdown :items="items" label="Select an option..." />
      <upw-dropdown
        :items="items"
        label=""
        toggle="navigation-menu-vertical"
        :toggle-rotate="false"
      />
    </section>

    <section class="flex w-full flex-wrap items-center gap-4">
      <h3 class="w-full">Size Variants</h3>
      <upw-dropdown :items="items" label="Select an option..." />
      <upw-dropdown size="sm" :items="items" label="Select an option..." />
      <upw-dropdown size="lg" :items="items" label="Select an option..." />
    </section>
  </div>
</template>

<script setup>
import { UpwDropdown } from "@upmind/upwind";

const items = {
  group1: {
    label: "Style Guide",
    // icon: "palette",
    children: [
      {
        href: "/style-guide/typography",
        label: "Typography",
        target: "_parent",
      },
      {
        href: "/style-guide/colors",
        label: "Colors",
        target: "_parent",
      },
      {
        href: "/style-guide/buttons",
        label: "Buttons",
        target: "_parent",
      },
    ],
  },
  group2: {
    label: "Other Resources",

    children: {
      account: {
        href: "",
        label: "Account settings",
        target: "_parent",
      },
      support: { href: "", label: "Support", target: "_parent" },
      license: { href: "", label: "License", target: "_parent" },
      signout: {
        href: "https://www.google.com",
        label: "Sign out",
        target: "_new",
      },
    },
  },
  alert: { icon: "cog", label: "Alert", action: () => alert("Alert!") },
};
</script>
