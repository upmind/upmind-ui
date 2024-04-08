<template>
  <div class="prose mx-auto flex max-w-none flex-wrap items-start gap-4 p-8">
    <upw-listbox class="max-w-sm" :items="items" label="Choose an option" />
    <upw-listbox
      class="max-w-sm"
      :items="items"
      multiple
      label="Choose multiple"
    />
    <upw-listbox
      class="max-w-sm"
      :items="items"
      multiple
      counter="chosen"
      label="Choose multiple (counter)"
    />

    <upw-listbox
      class="max-w-sm"
      :items="items"
      label=""
      icon="navigation-menu-vertical"
    />
  </div>
</template>

<script setup>
import { UpwListbox } from "@upmind/upwind";

const items = {
  typography: { label: "Typography", value: "typography" },
  colors: { label: "Colors", value: "colors" },
  buttons: { label: "Buttons", value: "buttons" },
  account: { label: "Account settings", value: "account" },
  support: { label: "Support", value: "support" },
  license: { label: "License", value: "license" },
  signout: { label: "Sign out", value: "signout" },
  alert: { icon: "cog", label: "Alert" },
};
</script>
