<template>
  <UpmLayout>
    <div class="mx-auto flex max-w-3xl flex-col gap-y-4">
      <Button class="is-secondary w-fit px-4 py-2" @click="goBack"
        >Back to list</Button
      >

      <Card class="p-4">
        <p v-if="hasError" class="text-red-600">
          meta.hasError — this email could not be loaded.
        </p>
        <template v-else>
          <p><strong>Subject:</strong> {{ data.subject }}</p>
          <p><strong>From:</strong> {{ data.from }}</p>
          <p><strong>To:</strong> {{ data.to }}</p>
          <p v-if="isBounced">
            <strong>Bounced:</strong> {{ data.dateBounced.relative }}
          </p>
          <p v-else-if="isError">
            <strong>Send failed:</strong> {{ data.dateErrored.relative }}
          </p>
          <p v-else-if="isSent">
            <strong>Sent:</strong> {{ data.dateSent.relative }}
          </p>
          <p v-else><strong>Sending…</strong></p>
          <div v-html="data.body" class="m-4 rounded border p-1.5" />
        </template>
      </Card>
    </div>
  </UpmLayout>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { UpmLayout } from "@upmind-automation/client-vue";
import {
  useClientReceivedEmail,
  ReceivedEmailContextTypes,
  ScopeActorTypes
} from "@upmind-automation/headless";
import { Button, Card } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const route = useRoute();
const router = useRouter();

const emailId = computed(() => route.params.emailId as string);

const email = useClientReceivedEmail()
  .as(ScopeActorTypes.CLIENT)
  .for(ReceivedEmailContextTypes.EMAIL, emailId.value);
const { data } = email.useContext();
// Destructured so each flag auto-unwraps as its own top-level template
// binding — `useMeta()` returns a plain object of individual `ComputedRef`s.
const { hasError, isBounced, isError, isSent } = email.useMeta();
const { destroy, isReady } = email.useActions();

// Per-email scoped instance — released on unmount so a detached registry
// entry (and its live TanStack observer) doesn't outlive this view, exactly
// as `EmailOverview.vue` does.
onUnmounted(() => destroy());

await isReady();

function goBack() {
  router.push({ name: "account.email-history.scoped" });
}
</script>
