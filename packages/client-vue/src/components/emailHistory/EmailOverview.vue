<template>
  <UpmSection :label="t('action.view_email')">
    <i18n-t keypath="text.email_overview_msg" tag="h1" />
    <div>
      <p>
        <strong>{{ t("text.subject") }}</strong
        >:
        {{ emailData.subject }}
      </p>
      <p>
        <strong>{{ t("text.to") }}</strong
        >: {{ emailData.to }}
      </p>
      <p>
        <strong>{{ t("text.from") }}</strong
        >: {{ emailData.from }}
      </p>
      <p v-if="emailData.meta.isBounced">
        <strong>{{ t("text.email_bounced") }}</strong
        >:
        {{ emailData.dateBounced.relative }}
      </p>
      <p v-else-if="emailData.meta.isError">
        <strong>{{ t("text.send_failed") }}</strong
        >:
        {{ emailData.dateErrored.relative }}
      </p>
      <p v-else-if="emailData.meta.isSent">
        <strong>{{ t("text.email_sent") }}</strong
        >:
        {{ emailData.dateSent.relative }}
      </p>
      <p v-else>
        <strong>{{ t("text.sending") }}</strong>
      </p>
      <p v-html="emailData.body" class="m-4 p-1.5" />
    </div>
  </UpmSection>
</template>
<script lang="ts" setup>
import { onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  useClientReceivedEmail,
  ScopeActorTypes
} from "@upmind-automation/headless";
import { UpmSection } from "../section";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{ emailId: string }>();

const { t } = useI18n();

const email = useClientReceivedEmail()
  .as(ScopeActorTypes.CLIENT)
  .withId(props.emailId);
const { data: emailData } = email.useContext();
const { destroy, isReady } = email.useActions();

// Per-email scoped instance — released on unmount so a detached registry
// entry (and its live TanStack observer) doesn't outlive this view.
onUnmounted(() => destroy());

await isReady();
</script>
