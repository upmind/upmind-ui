<template>
  <div class="prose mx-auto flex max-w-none flex-wrap items-start gap-4 p-8">
    <upw-dropdown :items="items" label="Select an option..." />

    <upw-dropdown :items="items" label="" icon="navigation-menu-vertical" />
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
