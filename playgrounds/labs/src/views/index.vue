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
                <Button
                  @click="router.push({ name: 'places' })"
                  color="primary"
                >
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
                    <p class="mt-1 text-gray-600">
                      Manage client phone numbers
                    </p>
                  </div>
                  <Button @click="router.push({ name: 'client.phones' })">
                    <Icon icon="arrow-right" size="xs" />
                  </Button>
                </div>

                <div class="flex items-center justify-between border-b">
                  <div>
                    <h5 class="font-medium">Client Emails</h5>
                    <p class="mt-1 text-gray-600">
                      Manage client email addresses
                    </p>
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

              <div class="flex items-center justify-between">
                <div>
                  <h5 class="font-medium">Basket Billing</h5>
                  <p class="mt-1 text-gray-600">
                    Manage basket billing details
                  </p>
                </div>
                <Button @click="router.push({ name: 'basket.billing' })">
                  <Icon icon="arrow-right" size="xs" />
                </Button>
              </div>
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
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// --- types

// -----------------------------------------------------------------------------
const router = useRouter();
</script>
