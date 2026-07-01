<template>
  <section v-if="canShowForms">
    <component
      :is="showVerifyEmailForm ? Interstitial : Slot"
      v-if="canShowForms"
      :open="showVerifyEmailForm"
      :data-attrs="{ 'data-testid': 'verify-email-heading' }"
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
      <div class="auth" :class="cn(styles.session.auth.root, props.class)">
        <Alert
          v-if="hasErrors"
          color="danger"
          icon="alert-triangle"
          :title="alertTitle"
          :description="errors"
          data-testid="auth-alert"
        />

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
          :class="styles.session.auth.form"
          :actions="formActions"
          :data-testid="`${currentForm}-form`"
        >
          <template v-if="currentForm === SESSION_FORMS.GUEST" #footer>
            <TermsAndConditions
              class="text-muted text-sm"
              :label="t('action.continue_label')"
            />
          </template>
        </Form>
      </div>

      <template v-if="showVerifyEmailForm">
        <Transition
          :enter-active-class="styles.session.transitions.fade.enter.active"
          :enter-from-class="styles.session.transitions.fade.enter.from"
          :enter-to-class="styles.session.transitions.fade.enter.to"
          :leave-active-class="styles.session.transitions.fade.leave.active"
          :leave-from-class="styles.session.transitions.fade.leave.from"
          :leave-to-class="styles.session.transitions.fade.leave.to"
          mode="out-in"
        >
          <div :key="resendState" :class="styles.session.auth.resend">
            <template v-if="canResend">
              <span
                :class="styles.session.auth.resendPrompt"
                data-testid="resend-prompt"
              >
                {{ t("auth.didnt_receive_code") }}
              </span>

              <Link
                size="sm"
                :label="t('action.resend_code')"
                data-testid="resend-code-link"
                @click.prevent="resend"
              />
            </template>

            <span
              v-else-if="isResending"
              :class="styles.session.auth.resendSending"
              data-testid="resend-sending"
            >
              {{ t("auth.verify_email_send") }}
            </span>
            <span
              v-else-if="resendComplete"
              :class="styles.session.auth.resendSent"
              data-testid="resend-sent"
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
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  ScopeActorTypes,
  useAccount,
  type VerifyEmailModel,
  type CompleteRegistrationModel
} from "@upmind-automation/headless";
import {
  useStyles,
  cn,
  Interstitial,
  Slot,
  type FormActionProps
} from "@upmind-automation/upmind-ui";
import { Alert, Link } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import config from "../session.config";
import { SESSION_FORMS } from "../types";
import type { SessionProps } from "../types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["resolve", "reject"]);
const props = withDefaults(defineProps<Omit<SessionProps, "modelValue">>(), {
  variant: "solid"
});

const modelValue = defineModel<SessionProps["modelValue"]>("modelValue", {
  default: SESSION_FORMS.LOGIN
});

const { t } = useI18n();

// --- Account for verify-email / guest-upgrade / resend (state-driven forms)
const account = useAccount().as(ScopeActorTypes.CLIENT);
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

// --- Surface bindings routed to the active form's owning composable
const styles = useStyles(
  [
    "session.auth",
    "session.transitions.fade.enter",
    "session.transitions.fade.leave"
  ],
  computed(() => ({
    showVerifyEmail: showVerifyEmailForm.value
  })),
  config
);

const currentForm = computed<SESSION_FORMS>(() => {
  // An unverified client owes email verification (sourced from the client
  // machine); it isn't in any guest/login/register state.
  if (showVerifyEmailForm.value) return SESSION_FORMS.VERIFY;
  // A guest client upgrading is its own form (sourced from the client machine);
  // it shares the register fields but has a distinct submit label/flow.
  if (showGuestUpgradeForm.value) return SESSION_FORMS.GUEST;

  return SESSION_FORMS.UNKNOWN;
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
    currentForm.value === SESSION_FORMS.GUEST
      ? t("action.register")
      : currentForm.value === SESSION_FORMS.VERIFY
        ? t("action.verify")
        : t("action.continue_label");

  const actions: Record<string, FormActionProps> = {
    submit: {
      type: "submit" as const,
      label,
      block: true,
      needsValid: true,
      size: "lg" as const,
      ...(currentForm.value === SESSION_FORMS.GUEST
        ? { dataAttrs: { "data-testid": "button-complete-registration" } }
        : {})
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
      variant: "link",
      ...(showVerifyEmailForm.value
        ? { dataAttrs: { "data-testid": "link-back-to-basket" } }
        : (props.cancelRoute ?? {}))
    };

    // add the storefront route to the cancel action if its provided
    //  usually only use din verify email but its a possibility for others as well
    if (props.cancelRoute) {
      actions.cancel = {
        ...actions.cancel,
        to: props.cancelRoute
      } as FormActionProps;
    }
  }
  return actions;
});

// ---

const alertTitle = computed(() => {
  if (resendFailed.value) return t("error.session_resend_failed");
  if (currentForm.value === SESSION_FORMS.VERIFY)
    return t("error.session_verify_failed");
  return t("error.session_register_failed");
});

// ---

async function toggleForm(type: SessionProps["modelValue"]) {
  switch (type) {
    case SESSION_FORMS.REGISTER:
      if (!showGuestUpgradeForm.value) {
        if (modelValue.value !== SESSION_FORMS.REGISTER)
          modelValue.value = SESSION_FORMS.REGISTER;
      }
      break;

    case SESSION_FORMS.VERIFY:
      // The verify form is state-driven (auto-entered when the client is
      // unverified) — there is no action to switch into it. Sync the model.
      if (
        showVerifyEmailForm.value &&
        modelValue.value !== SESSION_FORMS.VERIFY
      )
        modelValue.value = SESSION_FORMS.VERIFY;
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
      if (success) {
        emit("resolve", model);
      }
    });
  }
}

function doReject() {
  cancel();
  emit("reject");
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
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
