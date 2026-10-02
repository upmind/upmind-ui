<template>
  <section v-if="canShowForms">
    <component
      :is="showVerifyEmailForm ? Interstitial : Slot"
      v-if="canShowForms"
      :open="showVerifyEmailForm"
      :data-attrs="{ 'data-test-key': 'verify-email-heading' }"
      modal
      :title="t('auth.verify_email_title')"
      :text="t('auth.verify_email_msg')"
      :animated-icon="{
        icon: '2fa',
        delay: 5000,
        primaryColor: 'primary',
        secondaryColor: 'secondary',
        size: '4xl'
      }"
      @reject="doReject"
    >
      <div class="auth" :class="cn(authRootVariants(), props.class)">
        <Alert
          v-if="hasErrors"
          variant="danger"
          :title="alertTitle"
          :description="errors"
          :data-attrs="{
            'data-test-value': 'account'
          }"
        >
          <template #icon><Icon icon="alert-triangle" /></template>
        </Alert>

        <Form
          :disabled="!showGuestUpgradeForm && !showVerifyEmailForm"
          :key="currentForm"
          :processing="isProcessing"
          :model-value="model"
          :schema="schema"
          :uischema="uischema"
          :additional-errors="validationErrors"
          :variant="variant"
          @reject="doReject"
          @resolve="doResolve"
          :autosave="showVerifyEmailForm"
          @update:model-value="set"
          :class="authFormVariants({ showVerifyEmail: showVerifyEmailForm })"
          :actions="formActions"
          :dataAttrs="{
            'data-test-key': 'session-form',
            'data-test-value': currentForm
          }"
        >
          <template v-if="currentForm === AUTH_FORMS.GUEST" #footer>
            <TermsAndConditions
              class="text-muted text-sm"
              :label="t('action.continue_label')"
            />
          </template>
        </Form>
      </div>

      <template v-if="showVerifyEmailForm">
        <Transition
          :enter-active-class="transitionsFadeEnterActiveVariants()"
          :enter-from-class="transitionsFadeEnterFromVariants()"
          :enter-to-class="transitionsFadeEnterToVariants()"
          :leave-active-class="transitionsFadeLeaveActiveVariants()"
          :leave-from-class="transitionsFadeLeaveFromVariants()"
          :leave-to-class="transitionsFadeLeaveToVariants()"
          mode="out-in"
        >
          <div :key="resendState" :class="authResendVariants()">
            <template v-if="canResend">
              <span
                :class="authResendPromptVariants()"
                v-bind="resendPromptTestAttrs"
              >
                {{ t("auth.didnt_receive_code") }}
              </span>

              <Link
                size="sm"
                :data-attrs="{ 'data-test-key': 'resend-code-link' }"
                @click.prevent="resend"
                >{{ t("action.resend_code") }}</Link
              >
            </template>

            <span
              v-else-if="isResending"
              :class="authResendSendingVariants()"
              v-bind="resendSendingTestAttrs"
            >
              {{ t("auth.verify_email_send") }}
            </span>
            <span
              v-else-if="resendComplete"
              :class="authResendSentVariants()"
              v-bind="resendSentTestAttrs"
            >
              {{ t("auth.verify_email_sent") }}
            </span>
          </div>
        </Transition>
      </template>
    </component>
  </section>
</template>

<script lang="ts" setup>
import { Slot } from "@upmind/ui";
import { cn, Interstitial, Link, useTestAttrs } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Form } from "@upmind-automation/foundation";
import { Icon } from "@upmind-automation/foundation";
import { TermsAndConditions } from "@upmind-automation/foundation";
import {
  ScopeActorTypes,
  useAccount,
  useActiveSession,
  useRoutingEngine,
  type VerifyEmailModel,
  type CompleteRegistrationModel
} from "@upmind-automation/headless";
import { AUTH_FORMS } from "../types";
import {
  authRootVariants,
  authFormVariants,
  authResendVariants,
  authResendPromptVariants,
  authResendSendingVariants,
  authResendSentVariants,
  transitionsFadeEnterActiveVariants,
  transitionsFadeEnterFromVariants,
  transitionsFadeEnterToVariants,
  transitionsFadeLeaveActiveVariants,
  transitionsFadeLeaveFromVariants,
  transitionsFadeLeaveToVariants
} from "../variants";
import { assign } from "lodash-es";
import type { AuthProps } from "../types";
import type { FormActionProps } from "@upmind/ui";
// -----------------------------------------------------------------------------

const emit = defineEmits(["resolve", "reject"]);
const props = withDefaults(defineProps<Omit<AuthProps, "modelValue">>(), {
  variant: "primary"
});

const modelValue = defineModel<AuthProps["modelValue"]>("modelValue", {
  default: AUTH_FORMS.LOGIN
});

const { t } = useI18n();
const { navigate } = useRoutingEngine();

// --- Account for verify-email / guest-upgrade / resend (state-driven forms)
const account = useAccount().as(ScopeActorTypes.CLIENT);
const session = useActiveSession();
const {
  canResend,
  canShowForms,
  hasErrors,
  isProcessing,
  isResending,
  resendComplete,
  resendFailed,
  showGuestUpgradeForm,
  showVerifyEmailForm
} = account.useMeta();

const { errors, model, schema, uischema, validationErrors } =
  account.useContext();

const { cancel, register, resend, set, verify } = account.useActions();

const currentForm = computed<AUTH_FORMS>(() => {
  // An unverified client owes email verification (sourced from the client
  // machine); it isn't in any guest/login/register state.
  if (showVerifyEmailForm.value) return AUTH_FORMS.VERIFY;
  // A guest client upgrading is its own form (sourced from the client machine);
  // it shares the register fields but has a distinct submit label/flow.
  if (showGuestUpgradeForm.value) return AUTH_FORMS.GUEST;

  return AUTH_FORMS.UNKNOWN;
});

// Keyed so <Transition> fades between resend messages — the wrapper is
// otherwise the same element across states and would patch in place.
const resendState = computed(() => {
  if (canResend.value) return "prompt";
  if (isResending.value) return "sending";
  if (resendComplete.value) return "sent";
  if (resendFailed.value) return "failed";
  return "";
});

const formActions = computed(() => {
  const label =
    currentForm.value === AUTH_FORMS.GUEST
      ? t("action.register")
      : currentForm.value === AUTH_FORMS.VERIFY
        ? t("action.verify")
        : t("action.continue_label");
  const submitTestKey =
    currentForm.value === AUTH_FORMS.GUEST
      ? "button-complete-registration"
      : currentForm.value === AUTH_FORMS.VERIFY
        ? "button-verify"
        : "button-continue";

  const actions: Record<string, FormActionProps> = {
    submit: {
      type: "submit" as const,
      label,
      block: true,
      needsValid: true,
      size: "lg" as const,
      dataAttrs: { "data-test-key": submitTestKey }
    }
  };

  if (showVerifyEmailForm.value) {
    actions.cancel = {
      type: "reset" as const,
      label: showVerifyEmailForm.value
        ? t("action.back_to_basket")
        : t("action.cancel"),
      block: true,
      size: "lg",
      variant: "link"
    };
    assign(
      actions.cancel,
      showVerifyEmailForm.value
        ? { dataAttrs: { "data-test-key": "link-back-to-basket" } }
        : (props.cancelRoute ?? {})
    );

    // add the storefront route to the cancel action if its provided
    //  usually only use din verify email but its a possibility for others as well
    if (props.cancelRoute) {
      actions.cancel = assign({}, actions.cancel, { to: props.cancelRoute });
    }
  }
  return actions;
});

// ---

const alertTitle = computed(() => {
  if (resendFailed.value) return t("error.session_resend_failed");
  if (currentForm.value === AUTH_FORMS.VERIFY)
    return t("error.session_verify_failed");
  return t("error.session_register_failed");
});

// ---

async function toggleForm(type: AuthProps["modelValue"]) {
  switch (type) {
    case AUTH_FORMS.REGISTER:
      if (!showGuestUpgradeForm.value) {
        if (modelValue.value !== AUTH_FORMS.REGISTER)
          modelValue.value = AUTH_FORMS.REGISTER;
      }
      break;

    case AUTH_FORMS.VERIFY:
      // The verify form is state-driven (auto-entered when the client is
      // unverified) — there is no action to switch into it. Sync the model.
      if (showVerifyEmailForm.value && modelValue.value !== AUTH_FORMS.VERIFY)
        modelValue.value = AUTH_FORMS.VERIFY;
      break;
  }
}

function doResolve(model: unknown) {
  // Account forms submit through their own action; emit on success.
  if (showVerifyEmailForm.value) {
    verify(model as VerifyEmailModel).then(success => {
      if (success) {
        emit("resolve", model);
      }
    });
  } else if (showGuestUpgradeForm.value) {
    register(model as CompleteRegistrationModel).then(success => {
      if (!success) return;
      // Guest→client promotion (loadUser + actor flip) lands a beat after
      // register() resolves; wait for it so consumers re-reading session state
      // on resolve see the promoted client. Escalate rather than hang if the
      // user load fails.
      return session
        .useActions()
        .whenAuthenticated()
        .then(() => {
          emit("resolve", model);
        })
        .catch(() => {
          emit("reject");
        });
    });
  }
}

function doReject() {
  cancel();
  emit("reject");
  // Form engine ignores an action's `to`, so navigate to the cancelRoute
  // ourselves (the verify-email overlay sets it to the basket).
  const target = props.cancelRoute?.name?.toString();
  if (target) navigate(target);
}

onMounted(() => {
  toggleForm(modelValue.value);
});

watch(canShowForms, (canShow, couldShow) => {
  if (canShow && !couldShow) toggleForm(modelValue.value);
});

watch(modelValue, newValue => {
  toggleForm(newValue);
});

const resendPromptTestAttrs = useTestAttrs({ key: "resend-prompt" });
const resendSendingTestAttrs = useTestAttrs({ key: "resend-sending" });
const resendSentTestAttrs = useTestAttrs({ key: "resend-sent" });
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
