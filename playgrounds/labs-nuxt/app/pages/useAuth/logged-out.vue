<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="bg-success-100 mb-6 rounded-full p-4">
      <Icon icon="check-circle" class="text-success-600 h-12 w-12" />
    </div>
    <h2 class="text-display mb-2 text-2xl font-semibold">
      Successfully Logged Out
    </h2>
    <p class="text-muted mb-8 max-w-md">
      You have been securely logged out of your session.
    </p>
    <Button color="primary" @click="handleLoginAgain"> Login Again </Button>
  </div>
</template>

<script lang="ts" setup>
import { Button, Icon } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

definePageMeta({
  name: "useAuth-logged-out"
});

const router = useRouter();

/**
 * Navigate back to the main useAuth route to start fresh login.
 * This will remount the page and create a new auth instance.
 */
function handleLoginAgain() {
  router.replace({ name: "useAuth" });
}
</script>
