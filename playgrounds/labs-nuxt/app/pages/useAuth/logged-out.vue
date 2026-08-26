<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="bg-success-muted mb-6 rounded-full p-4">
      <Icon
        icon="check-circle"
        size="2xl"
        class="text-success-muted-contrast"
      />
    </div>
    <h2 class="text-display mb-2 text-2xl font-semibold">
      Successfully Logged Out
    </h2>
    <p class="text-muted mb-8 max-w-md">
      You have been securely logged out of your session.
    </p>
    <Button variant="primary" @click="handleLoginAgain"> Login Again </Button>
  </div>
</template>

<script lang="ts" setup>
import { Button } from "@upmind/ui";
import { Icon } from "@upmind-automation/client-vue";

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
