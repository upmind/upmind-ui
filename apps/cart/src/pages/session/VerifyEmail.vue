<template>
  <div class="flex grow items-center justify-center">
    <Interstitial
      modal
      :dismissable="false"
      :title="t('auth.verify_email_title')"
      :text="t('auth.verify_email_msg')"
      :actions="actions"
    >
      <template #avatar><span /></template>

      <div class="flex w-full flex-col items-center gap-4">
        <InputOTP
          v-model="code"
          :disabled="isProcessing"
          :aria-invalid="!!errors"
          align="center"
          auto-focus
          @complete="onSubmit"
        />

        <p
          v-if="errors"
          role="alert"
          class="text-destructive text-center text-sm"
        >
          {{ errors }}
        </p>

        <p class="flex items-center justify-center gap-2 text-sm">
          <span>{{ t("auth.didnt_receive_code") }}</span>
          <Link
            size="sm"
            :label="resendLabel"
            :disabled="cooldownRemaining > 0 || isResending"
            @click.prevent="onResend"
          />
        </p>
      </div>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientEmails,
  useFeedback,
  useRoutingEngine,
  useSession
} from "@upmind-automation/client-vue";
import { InputOTP, Interstitial, Link } from "@upmind-automation/upmind-ui";
import { ROUTE } from "../../router";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigate, navigateNext } = useRoutingEngine();
const { client, errors, meta, refresh, verifyEmail } = useSession();
const { verify: resendVerification } = useClientEmails();
const { addWarning } = useFeedback();

// --- state
const code = ref("");
const isProcessing = ref(false);
const isResending = ref(false);
const cooldownRemaining = ref(0);

let cooldownTimer: ReturnType<typeof setInterval> | undefined;

// --- computed
const resendLabel = computed(() =>
  cooldownRemaining.value > 0
    ? t("action.resend_code_in", { seconds: cooldownRemaining.value })
    : t("action.resend_code")
);

const actions = computed(() => [
  {
    icon: "arrow-left",
    variant: "ghost",
    color: "muted",
    label: t("action.continue_shopping"),
    handler: onContinueShopping
  },
  {
    iconAppend: "check",
    variant: "solid",
    color: "primary",
    label: t("action.verify"),
    handler: onSubmit
  }
]);

// --- methods
async function onSubmit() {
  if (isProcessing.value) return;
  isProcessing.value = true;
  try {
    // Empty / partial code → just re-check the verified flag against `/self`.
    if (!code.value || code.value.length < 6) {
      await refresh();
      if (meta.value.isUnverified) {
        addWarning(t("auth.verify_email_still_required"));
      } else {
        await navigateNext();
      }
      return;
    }

    const verified = await verifyEmail({ code: code.value });
    if (verified) await navigateNext();
  } finally {
    isProcessing.value = false;
  }
}

async function onResend() {
  if (cooldownRemaining.value > 0 || isResending.value) return;
  const emailId = client.value?.primaryEmail?.id;
  if (!emailId) return;

  isResending.value = true;
  try {
    await resendVerification(emailId);
    startCooldown(60);
  } finally {
    isResending.value = false;
  }
}

function onContinueShopping() {
  navigate(ROUTE.CATALOGUE);
}

function startCooldown(seconds: number) {
  cooldownRemaining.value = seconds;
  cooldownTimer = setInterval(() => {
    cooldownRemaining.value -= 1;
    if (cooldownRemaining.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = undefined;
    }
  }, 1000);
}

// --- lifecycle
onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});
</script>
