<template>
  <UpmContentSection class="mx-auto max-w-xl" title="Welcome to Upmind Labs">
    <h3 class="mt-0">
      This is a playground for Upmind components and utilities.
    </h3>

    <div class="mt-8">
      <div class="space-y-8">
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
            <Button @click="router.push({ name: 'places' })" color="primary">
              <Icon icon="arrow-right" size="xs" />
            </Button>
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
              <Button @click="router.push({ name: 'client.addresses' })">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Phone Numbers</h5>
                <p class="mt-1 text-gray-600">Manage client phone numbers</p>
              </div>
              <Button @click="router.push({ name: 'client.phones' })">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Emails</h5>
                <p class="mt-1 text-gray-600">Manage client email addresses</p>
              </div>
              <Button @click="router.push({ name: 'client.emails' })">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Client Companies</h5>
                <p class="mt-1 text-gray-600">Manage client company data</p>
              </div>
              <Button @click="router.push({ name: 'client.companies' })">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Basket Management -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Basket Management</h4>

<<<<<<< HEAD
          <div class="flex items-center justify-between border-b">
=======
          <div class="flex items-center justify-between">
>>>>>>> feat/FE-311-refactor-client-into-composables
            <div>
              <h5 class="font-medium">Basket Billing</h5>
              <p class="mt-1 text-gray-600">Manage basket billing details</p>
            </div>
            <Button @click="router.push({ name: 'basket.billing' })">
              <Icon icon="arrow-right" size="xs" />
            </Button>
          </div>
        </div>
<<<<<<< HEAD

        <!-- Forms & Renderers -->
        <div>
          <h4 class="mb-4 text-lg font-medium">Forms & Renderers</h4>

          <div class="space-y-4">
            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Address Renderer</h5>
                <p class="mt-1 text-gray-600">Search and select an address</p>
              </div>
              <Button @click="router.push({ name: 'form.address' })">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </div>

            <div class="flex items-center justify-between border-b">
              <div>
                <h5 class="font-medium">Domain Renderer</h5>
                <p class="mt-1 text-gray-600">
                  Search and manage basket domains
                </p>
              </div>
              <Button @click="router.push({ name: 'form.domain' })">
                <Icon icon="arrow-right" size="xs" />
              </Button>
            </div>
          </div>
        </div>
=======
>>>>>>> feat/FE-311-refactor-client-into-composables
      </div>
    </div>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
import { useRouter } from "vue-router";

// --- internal

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// --- types

// -----------------------------------------------------------------------------
const router = useRouter();
</script>
