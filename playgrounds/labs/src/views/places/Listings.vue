<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    title="Address Search"
    subtitle="Search for addresses using the Places API"
  >
    <UpmCard class="p-4">
      <!-- Debug Info -->
      <div class="mb-4 border-b pb-2 text-xs">
        <div>
          API Key: {{ apiKey ? apiKey.substring(0, 8) + "..." : "Not found" }}
        </div>
        <div>Status: {{ apiStatus }}</div>
      </div>

      <!-- Search Input -->
      <div class="mb-6">
        <Input
          v-model="searchQuery"
          label="Search for an address"
          placeholder="Type at least 3 characters..."
          :loading="isLoading"
          @update:modelValue="onSearchInput"
        />
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mb-4 rounded bg-red-50 p-3 text-red-500">
        {{ error }}
      </div>

      <!-- Results -->
      <div v-if="parsedResults.length > 0">
        <h3 class="mb-2 font-medium">Parsed Addresses</h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            v-for="(place, index) in parsedResults"
            :key="index"
            class="rounded-md border p-4 hover:bg-gray-50"
          >
            <div class="space-y-2">
              <div v-if="place.address?.name" class="flex gap-1">
                <span class="font-bold">Name:</span>
                <span>{{ place.address.name }}</span>
              </div>
              <div v-if="place.address?.address1" class="flex gap-1">
                <span class="font-bold">Address:</span>
                <span>{{ place.address.address1 }}</span>
              </div>
              <div v-if="place.address?.address2" class="flex gap-1">
                <span class="font-bold">Address 2:</span>
                <span>{{ place.address.address2 }}</span>
              </div>
              <div v-if="place.address?.city" class="flex gap-1">
                <span class="font-bold">City:</span>
                <span>{{ place.address.city }}</span>
              </div>
              <div v-if="place.address?.postcode" class="flex gap-1">
                <span class="font-bold">Postal Code:</span>
                <span>{{ place.address.postcode }}</span>
              </div>
            </div>

            <details class="mt-2">
              <summary class="cursor-pointer text-sm text-secondary">
                View Raw Data
              </summary>
              <pre
                class="mt-2 max-h-72 overflow-auto rounded-md border p-2 text-xs"
                >{{ JSON.stringify(place, null, 2) }}</pre
              >
            </details>
          </div>
        </div>
      </div>

      <div
        v-else-if="searchQuery.length >= 3 && !isLoading"
        class="py-6 text-center text-gray-500"
      >
        No results found
      </div>
    </UpmCard>
  </UpmContentSection>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es";
import { usePlaces } from "@upmind-automation/headless";
import { ref, onMounted } from "vue";
import { Input } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// State
const searchQuery = ref("");
const parsedResults = ref<any[]>([]);
const isLoading = ref(false);
const error = ref("");
const apiKey = ref(import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY || "");
const apiStatus = ref("Not initialized");

// Initialize Places service
const places = usePlaces();

// Load Places API when component mounts
onMounted(async () => {
  try {
    console.log("API Key:", apiKey.value);
    console.log("Environment variables:", import.meta.env);

    isLoading.value = true;
    apiStatus.value = "Initializing...";
    await places.load();
    apiStatus.value = "Ready";
  } catch (err) {
    error.value = "Failed to initialize Places API. Check your API key.";
    apiStatus.value = "Error";
    console.error("Places API initialization error:", err);
  } finally {
    isLoading.value = false;
  }
});

// Search for addresses with debounce
const onSearchInput = debounce(async (query: string) => {
  // Reset results when input changes
  parsedResults.value = [];

  // Only search when we have at least 3 characters
  if (!query || query.length < 3) return;

  try {
    isLoading.value = true;
    error.value = "";
    apiStatus.value = "Searching...";
    const results = await places.search(query);
    console.log("Parsed address results:", results);
    parsedResults.value = results || [];
    apiStatus.value = "Ready";
  } catch (err) {
    error.value = "Error searching for places";
    apiStatus.value = "Error";
    console.error("Search error:", err);
  } finally {
    isLoading.value = false;
  }
}, 300);
</script>
