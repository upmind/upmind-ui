<template>
  <div class="prose mx-auto max-w-none px-8 pb-8">
    <h3 class="mt-8">Types/Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="flat" label="Flat (Solid)" />
      <upw-button variant="outlined" label="Outlined" />
      <upw-button variant="ghost" label="Ghost" />
      <upw-button variant="plain" label="Plain (Soft)" />
      <upw-button variant="elevated" label="Elevated" />
      <upw-button variant="link" label="Link" />
    </div>

    <h3 class="mt-8">Size Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button
        prepend-icon="cog"
        append-icon="arrow-down"
        variant="plain"
        size="sm"
        label="Small"
      />
      <upw-button
        prepend-icon="cog"
        append-icon="arrow-down"
        variant="plain"
        label="Default"
      />
      <upw-button
        prepend-icon="cog"
        append-icon="arrow-down"
        variant="plain"
        size="lg"
        label="Large"
      />

      <upw-button
        variant="plain"
        size="icon"
        prepend-icon="cog"
        label="Icon Only"
      />
      <upw-button
        variant="plain"
        prepend-icon="cog"
        size="block"
        label="Block"
      />
    </div>

    <h3 class="mt-8">Solid Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button color="primary" label="Primary" />
      <upw-button color="secondary" label="Secondary" />
      <upw-button color="accent" label="Accent" />
      <upw-button color="neutral" label="Neutral" />
      <upw-button color="info" label="Info" />
      <upw-button color="success" label="Success" />
      <upw-button color="error" label="Error" />
      <upw-button color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Outlined Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="outlined" color="primary" label="Primary" />
      <upw-button variant="outlined" color="secondary" label="Secondary" />
      <upw-button variant="outlined" color="accent" label="Accent" />
      <upw-button variant="outlined" color="neutral" label="Neutral" />
      <upw-button variant="outlined" color="info" label="Info" />
      <upw-button variant="outlined" color="success" label="Success" />
      <upw-button variant="outlined" color="error" label="Error" />
      <upw-button variant="outlined" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Ghost Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="ghost" color="primary" label="Primary" />
      <upw-button variant="ghost" color="secondary" label="Secondary" />
      <upw-button variant="ghost" color="accent" label="Accent" />
      <upw-button variant="ghost" color="neutral" label="Neutral" />
      <upw-button variant="ghost" color="info" label="Info" />
      <upw-button variant="ghost" color="success" label="Success" />
      <upw-button variant="ghost" color="error" label="Error" />
      <upw-button variant="ghost" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Plain (Soft) Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="plain" color="primary" label="Primary" />
      <upw-button variant="plain" color="secondary" label="Secondary" />
      <upw-button variant="plain" color="accent" label="Accent" />
      <upw-button variant="plain" color="neutral" label="Neutral" />
      <upw-button variant="plain" color="info" label="Info" />
      <upw-button variant="plain" color="success" label="Success" />
      <upw-button variant="plain" color="error" label="Error" />
      <upw-button variant="plain" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Elevated Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="elevated" color="primary" label="Primary" />
      <upw-button variant="elevated" color="secondary" label="Secondary" />
      <upw-button variant="elevated" color="accent" label="Accent" />
      <upw-button variant="elevated" color="neutral" label="Neutral" />
      <upw-button variant="elevated" color="info" label="Info" />
      <upw-button variant="elevated" color="success" label="Success" />
      <upw-button variant="elevated" color="error" label="Error" />
      <upw-button variant="elevated" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Link Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="link" color="primary" label="Primary" />
      <upw-button variant="link" color="secondary" label="Secondary" />
      <upw-button variant="link" color="accent" label="Accent" />
      <upw-button variant="link" color="neutral" label="Neutral" />
      <upw-button variant="link" color="info" label="Info" />
      <upw-button variant="link" color="success" label="Success" />
      <upw-button variant="link" color="error" label="Error" />
      <upw-button variant="link" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Loading Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button loading variant="plain" color="primary" label="Primary" />
      <upw-button loading variant="plain" color="secondary" label="Secondary" />
      <upw-button loading variant="plain" color="accent" label="Accent" />
      <upw-button loading variant="plain" color="neutral" label="Neutral" />
      <upw-button loading variant="plain" color="info" label="Info" />
      <upw-button loading variant="plain" color="success" label="Success" />
      <upw-button loading variant="plain" color="error" label="Error" />
      <upw-button loading variant="plain" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Disabled Color Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button disabled variant="plain" color="primary" label="Primary" />
      <upw-button
        disabled
        variant="plain"
        color="secondary"
        label="Secondary"
      />
      <upw-button disabled variant="plain" color="accent" label="Accent" />
      <upw-button disabled variant="plain" color="neutral" label="Neutral" />
      <upw-button disabled variant="plain" color="info" label="Info" />
      <upw-button disabled variant="plain" color="success" label="Success" />
      <upw-button disabled variant="plain" color="error" label="Error" />
      <upw-button disabled variant="plain" color="warning" label="Warning" />
    </div>

    <h3 class="mt-8">Shape Variants</h3>
    <div class="flex flex-wrap items-center gap-4">
      <upw-button variant="plain" shape="none" label="No Shaped" />
      <upw-button variant="plain" shape="sm" label="Small Shaped" />
      <upw-button variant="plain" shape="md" label="Medium Shaped" />
      <upw-button variant="plain" shape="lg" label="Large Shaped" />
      <upw-button variant="plain" shape="xl" label="Xtra Large Shaped" />
      <upw-button variant="plain" shape="pill" label="Pill Shaped" />
    </div>
  </div>
</template>

<script setup>
import { UpwButton } from "@upmind/upwind";
</script>
