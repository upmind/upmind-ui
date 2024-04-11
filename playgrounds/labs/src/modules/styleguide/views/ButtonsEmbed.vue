<template>
  <div
    class="prose mx-auto flex max-w-none flex-wrap place-content-start items-start justify-start gap-4 p-8"
  >
    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Types/Variants</h3>
      <upw-button variant="flat" label="Flat (Solid)" />
      <upw-button variant="outlined" label="Outlined" />
      <upw-button variant="ghost" label="Ghost" />
      <upw-button variant="link" label="Link" />
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Slot + Size variants</h3>
      <p class="w-full">
        Buttons with all slots activated in ALL sizes<br />
        prepend-avatar | prepend-icon | append-icon | append-avatar
      </p>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Icon only Variants</h4>
        <upw-button icon-only prepend-icon="cog" size="sm" label="Small" />
        <upw-button icon-only prepend-icon="cog" label="Default" />
        <upw-button icon-only prepend-icon="cog" size="lg" label="Large" />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Label Only</h4>

        <upw-button size="sm" label="Small" />
        <upw-button label="Default" />
        <upw-button size="lg" label="Large" />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Label with Avatar (prepended)</h4>

        <upw-button
          size="sm"
          label="Small"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
        />
        <upw-button
          label="Default"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
        />
        <upw-button
          size="lg"
          label="Large"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
        />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Label with Icon (prepended)</h4>

        <upw-button size="sm" label="Small" prepend-icon="cog" />
        <upw-button label="Default" prepend-icon="cog" />
        <upw-button size="lg" label="Large" prepend-icon="cog" />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Label with Icon (appended)</h4>

        <upw-button size="sm" label="Small" append-icon="devices" />
        <upw-button label="Default" append-icon="devices" />
        <upw-button size="lg" label="Large" append-icon="devices" />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Label with Avatar (appended)</h4>

        <upw-button
          size="sm"
          label="Small"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
        <upw-button
          label="Default"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
        <upw-button
          size="lg"
          label="Large"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Everything</h4>

        <upw-button
          size="sm"
          label="Small"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          prepend-icon="cog"
          append-icon="devices"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
        <upw-button
          label="Default"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          prepend-icon="cog"
          append-icon="devices"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
        <upw-button
          size="lg"
          label="Large"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          prepend-icon="cog"
          append-icon="devices"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2">
        <h4 class="w-full">Everything (block)</h4>

        <upw-button
          block
          size="sm"
          label="Small"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          prepend-icon="cog"
          append-icon="devices"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
        <upw-button
          block
          label="Default"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          prepend-icon="cog"
          append-icon="devices"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
        <upw-button
          block
          size="lg"
          label="Large"
          :prepend-avatar="{ name: 'ZA', path: 'flags' }"
          prepend-icon="cog"
          append-icon="devices"
          :append-avatar="{ name: 'GB', path: 'flags' }"
        />
      </div>
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Solid Color Variants</h3>
      <upw-button color="primary" label="Primary" />
      <upw-button color="secondary" label="Secondary" />
      <upw-button color="accent" label="Accent" />
      <upw-button color="neutral" label="Neutral" />
      <upw-button color="info" label="Info" />
      <upw-button color="success" label="Success" />
      <upw-button color="error" label="Error" />
      <upw-button color="warning" label="Warning" />
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Outlined Color Variants</h3>
      <upw-button variant="outlined" color="primary" label="Primary" />
      <upw-button variant="outlined" color="secondary" label="Secondary" />
      <upw-button variant="outlined" color="accent" label="Accent" />
      <upw-button variant="outlined" color="neutral" label="Neutral" />
      <upw-button variant="outlined" color="info" label="Info" />
      <upw-button variant="outlined" color="success" label="Success" />
      <upw-button variant="outlined" color="error" label="Error" />
      <upw-button variant="outlined" color="warning" label="Warning" />
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Ghost Color Variants</h3>
      <upw-button variant="ghost" color="primary" label="Primary" />
      <upw-button variant="ghost" color="secondary" label="Secondary" />
      <upw-button variant="ghost" color="accent" label="Accent" />
      <upw-button variant="ghost" color="neutral" label="Neutral" />
      <upw-button variant="ghost" color="info" label="Info" />
      <upw-button variant="ghost" color="success" label="Success" />
      <upw-button variant="ghost" color="error" label="Error" />
      <upw-button variant="ghost" color="warning" label="Warning" />
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Link Color Variants</h3>
      <upw-button variant="link" color="primary" label="Primary" />
      <upw-button variant="link" color="secondary" label="Secondary" />
      <upw-button variant="link" color="accent" label="Accent" />
      <upw-button variant="link" color="neutral" label="Neutral" />
      <upw-button variant="link" color="info" label="Info" />
      <upw-button variant="link" color="success" label="Success" />
      <upw-button variant="link" color="error" label="Error" />
      <upw-button variant="link" color="warning" label="Warning" />
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Loading Color Variants</h3>
      <upw-button :loading="isLoading" color="primary" label="Primary" />
      <upw-button :loading="isLoading" color="secondary" label="Secondary" />
      <upw-button :loading="isLoading" color="accent" label="Accent" />
      <upw-button :loading="isLoading" color="neutral" label="Neutral" />
      <upw-button :loading="isLoading" color="info" label="Info" />
      <upw-button :loading="isLoading" color="success" label="Success" />
      <upw-button :loading="isLoading" color="error" label="Error" />
      <upw-button :loading="isLoading" color="warning" label="Warning" />
    </section>

    <section class="flex w-full flex-wrap items-center gap-2">
      <h3 class="w-full">Disabled Color Variants</h3>
      <upw-button disabled color="primary" label="Primary" />
      <upw-button disabled color="secondary" label="Secondary" />
      <upw-button disabled color="accent" label="Accent" />
      <upw-button disabled color="neutral" label="Neutral" />
      <upw-button disabled color="info" label="Info" />
      <upw-button disabled color="success" label="Success" />
      <upw-button disabled color="error" label="Error" />
      <upw-button disabled color="warning" label="Warning" />
    </section>
  </div>
</template>

<script setup>
import { UpwButton } from "@upmind/upwind";
import { onMounted, ref } from "vue";

const isLoading = ref(true);

onMounted(() => {
  setInterval(() => {
    isLoading.value = !isLoading.value;
  }, 2000);
});
</script>
