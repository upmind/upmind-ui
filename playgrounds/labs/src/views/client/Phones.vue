<template>
  <article>
    <UpmContentSection class="mx-auto max-w-app" class-content="gap-2 flex">
      <Button
        type="reset"
        class="relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        label="Addresses"
        @click.prevent="router.push({ name: 'client.addresses' })"
      >
      </Button>
      <Button
        type="reset"
        class="relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        label="Emails"
        @click.prevent="router.push({ name: 'client.emails' })"
      >
      </Button>
      <Button
        type="reset"
        class="relative -top-4 md:-top-6"
        size="sm"
        variant="tonal"
        label="Phones"
        @click.prevent="router.push({ name: 'client.phones' })"
        disabled
      >
      </Button>
    </UpmContentSection>

    <UpmContentSection class="mx-auto max-w-app" title="Phones">
      <UpmCard class="pb-3 md:pb-3">
        <!-- custom components go here -->
      </UpmCard>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal
import { useRoutingEngine } from "@upmind-automation/headless-vue";

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// --- types

// -----------------------------------------------------------------------------

const router = useRouter();

function doEdit(id: string) {
  // code here..... then

  router.push({ params: { id } });
}
</script>
