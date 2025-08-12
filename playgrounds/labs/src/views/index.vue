<template>
  <UpmContentSection class="mx-auto max-w-xl" title="Welcome to Upmind Labs">
    <h3 class="mt-0">
      This is a playground for Upmind components and utilities.
    </h3>

    <div class="mt-8">
      <div class="space-y-8">
        <!-- Brand -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Brand</h4>
          <div class="flex items-center justify-between border-b">
            <div>
              <h5 class="font-medium">Brand Playground</h5>
              <p class="mt-1 text-gray-600">
                Test the brand components and utilities
              </p>
            </div>
            <RouterLink :to="{ name: 'brand' }">
              <Button color="primary">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </RouterLink>
          </div>
        </div>

        <!-- Places API -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Places API</h4>
          <div class="flex items-center justify-between border-b">
            <div>
              <h5 class="font-medium">Places API Playground</h5>
              <p class="mt-1 text-gray-600">
                Test the Google Places API for address search
              </p>
            </div>
            <RouterLink :to="{ name: 'places' }">
              <Button color="primary">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </RouterLink>
          </div>
        </div>

        <!-- Feedback -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Feedback Management</h4>

          <div class="space-y-4">
            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Feedback Machine</h5>
                <p class="mt-1 text-gray-600">
                  Manage and view feedback submissions
                </p>
              </div>
              <RouterLink :to="{ name: 'feedback' }">
                <Button>
                  <Icon icon="arrow-right" size="xs" />
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Client Management -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Client Management</h4>

          <div class="space-y-4">
            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Addresses</h5>
                <p class="mt-1 text-gray-600">Manage client address data</p>
              </div>
              <RouterLink :to="{ name: 'client.addresses' }">
                <Button>
                  <Icon icon="arrow-right" size="xs" />
                </Button>
              </RouterLink>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Phone Numbers</h5>
                <p class="mt-1 text-gray-600">Manage client phone numbers</p>
              </div>
              <RouterLink :to="{ name: 'client.phones' }">
                <Button>
                  <Icon icon="arrow-right" size="xs" />
                </Button>
              </RouterLink>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Emails</h5>
                <p class="mt-1 text-gray-600">Manage client email addresses</p>
              </div>
              <RouterLink :to="{ name: 'client.emails' }">
                <Button>
                  <Icon icon="arrow-right" size="xs" />
                </Button>
              </RouterLink>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Companies</h5>
                <p class="mt-1 text-gray-600">Manage client company data</p>
              </div>
              <RouterLink :to="{ name: 'client.companies' }">
                <Button>
                  <Icon icon="arrow-right" size="xs" />
                </Button>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Basket Management -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Basket Management</h4>

          <div class="flex items-center justify-between border-b">
            <div>
              <h5 class="font-medium">Checkout Billing</h5>
              <p class="mt-1 text-gray-600">Manage checkout billing details</p>
            </div>
            <RouterLink :to="{ name: 'billing' }">
              <Button color="primary">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </RouterLink>
          </div>
        </div>

        <!-- Client Templates -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Client Templates</h4>

          <div class="flex items-center justify-between border-b">
            <div>
              <h5 class="font-medium">Slots</h5>
              <p class="mt-1 text-gray-600">
                Explore client slots for dynamic content rendering
              </p>
            </div>
            <RouterLink :to="{ name: 'client-area.slots' }">
              <Button>
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </RouterLink>
          </div>
        </div>

        <!-- Products Management -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Products Management</h4>

          <div class="flex items-center justify-between border-b">
            <div>
              <h5 class="font-medium">Products Catalogue</h5>
              <p class="mt-1 text-gray-600">
                Browse and test the products catalogue API
              </p>
            </div>
            <RouterLink :to="{ name: 'products.catalogue' }">
              <Button>
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { UpmContentSection } from "@upmind-automation/client-vue";
</script>
