<template>
  <UpmLayout :layout="LAYOUT_VARIANTS.CANVAS_CARD">
    <template #controls>
      <div class="flex w-full flex-col items-center justify-between gap-4">
        <div class="flex flex-col justify-center gap-2 md:flex-row">
          <Button
            size="sm"
            variant="subtle"
            @click.prevent="router.push({ name: 'client.addresses' })"
          >
            Addresses
          </Button>
          <Button
            size="sm"
            variant="subtle"
            @click.prevent="router.push({ name: 'client.emails' })"
          >
            Emails
          </Button>
          <Button
            size="sm"
            variant="subtle"
            @click.prevent="router.push({ name: 'client.phones' })"
          >
            Phones
          </Button>
          <Button
            size="sm"
            variant="subtle"
            @click.prevent="router.push({ name: 'client.companies' })"
          >
            Companies
          </Button>
        </div>

        <Alert
          v-if="!isAuthenticated && !isLoading"
          color="danger"
          title="Please log in to use client companies"
        />
      </div>
    </template>

    <UpmRouteView v-if="isAuthenticated && !!clientId" />
  </UpmLayout>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import {
  UpmLayout,
  UpmRouteView,
  LAYOUT_VARIANTS,
  useActiveSession
} from "@upmind-automation/client-vue";
import { Button, Alert } from "@upmind/ui";

// -----------------------------------------------------------------------------

const router = useRouter();

const session = useActiveSession();
const { isAuthenticated, isLoading } = session.useMeta();
const { sessionId: clientId } = session.useContext();
</script>
