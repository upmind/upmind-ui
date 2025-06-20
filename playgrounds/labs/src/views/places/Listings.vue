<template>
  <UpmContentSection
    class="mx-auto max-w-app"
    title="Address Search"
    subtitle="Search for addresses using the Places API"
  >
    <UpmCard class="space-y-8">
      <!-- Debug Info -->
      <div class="border-b pb-2 text-xs">
        <div>
          API Key: {{ apiKey ? apiKey.substring(0, 8) + "..." : "Not found" }}
        </div>
        <div>Status: {{ apiStatus }}</div>
      </div>

      <!-- Search Input -->
      <div class="mx-auto max-w-md">
        <Input
          v-model="searchQuery"
          label="Search for an address"
          placeholder="Type at least 3 characters..."
          :loading="isLoading"
        />
      </div>

      <!-- Error Display -->
      <div v-if="error" class="rounded bg-destructive-50 p-3 text-destructive">
        {{ error }}
      </div>

      <!-- Results -->
      <div v-if="parsedResults.length > 0">
        <h3 class="font-medium">Parsed Addresses</h3>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div
            v-for="(place, index) in parsedResults"
            :key="index"
            class="rounded-lg border p-4 transition-all hover:bg-secondary/15 hover:shadow-lg"
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

            <div class="mt-2">
              <Button size="sm" @click="openJsonDialog(place)">
                View Raw Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="searchQuery.length >= 3 && !isLoading"
        class="text-center"
      >
        No results found
      </div>
    </UpmCard>
  </UpmContentSection>

  <!-- JSON Data Dialog -->
  <Dialog :open="isDialogOpen" title="Raw Address Data">
    <div class="max-h-[60vh] overflow-auto">
      <pre
        class="overflow-auto rounded-lg bg-primary p-4 text-xs text-primary-foreground"
        >{{ selectedJsonData }}</pre
      >
    </div>
    <template #footer>
      <Button @click="isDialogOpen = false">Close</Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es";
import { usePlaces } from "@upmind-automation/headless";
import { ref, onMounted, watch } from "vue";
import { Input, Button, Dialog } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// State
const searchQuery = ref("");
const parsedResults = ref<any[]>([]);
const isLoading = ref(false);
const error = ref("");
const apiKey = ref(import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY || "");
const apiStatus = ref("Not initialized");

// Dialog state
const isDialogOpen = ref(false);
const selectedJsonData = ref("");

// Dialog functions
function openJsonDialog(place: any) {
  selectedJsonData.value = JSON.stringify(place, null, 2);
  isDialogOpen.value = true;
}

// Initialize Places service
const places = usePlaces();

// Load Places API when component mounts
onMounted(async () => {
  try {
    console.log("API Key:", apiKey.value);
    console.log("Environment variables:", import.meta.env);

    isLoading.value = true;
    apiStatus.value = "Initializing...";
    await places.isReady();
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
const searchAddresses = debounce(async (query: string) => {
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

// Watch for changes to searchQuery
watch(searchQuery, newQuery => {
  searchAddresses(newQuery);
});
</script>
