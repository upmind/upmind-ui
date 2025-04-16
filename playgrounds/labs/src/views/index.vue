<template>
  <article>
    <UpmContentSection
      class="mx-auto max-w-app"
      content-class=""
      title="Welcome to Upmind Labs"
    >
      <UpmCard class="pb-3 md:pb-3">
        <h3 class="mt-0">
          This is a playground for Upmind components and utilities.
        </h3>

        <div class="mt-8">
          <h4 class="mb-4 text-lg font-medium">Available Playground Pages:</h4>

          <div class="space-y-4">
            <div>
              <Button @click="router.push({ name: 'places' })" color="primary">
                Places API Playground
              </Button>
              <span class="ml-4 text-gray-600"
                >Test the Google Places API for address search</span
              >
            </div>
          </div>
        </div>
      </UpmCard>
    </UpmContentSection>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// --- types

// -----------------------------------------------------------------------------
const router = useRouter();
</script>
