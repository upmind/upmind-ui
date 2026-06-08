<template>
  <section v-if="meta.canShowForms && !meta.isLoading">
    <component
      :is="meta.show2fa || meta.showVerifyEmailForm ? Interstitial : Slot"
      v-if="meta.canShowForms && !meta.isLoading"
      :open="meta.show2fa || meta.showVerifyEmailForm"
      modal
      :title="interstitialTitle"
      :text="interstitialText"
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
          v-if="meta.hasErrors"
          color="danger"
          icon="alert-triangle"
          :title="alertTitle"
          :description="errors"
          data-testid="auth-alert"
        />

        <Form
          :disabled="
            meta.isAuthenticated &&
            !meta.showGuestUpgradeForm &&
            !meta.showVerifyEmailForm
          "
          :key="currentForm"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :model-value="model"
          :schema="schema"
          :uischema="formUischema"
          :additional-errors="validationErrors"
          :variant="variant"
          @reject="doReject"
          @resolve="doResolve"
          @update:model-value="setModel"
          :class="styles.session.auth.form"
          :actions="formActions"
          :data-testid="`${currentForm}-form`"
        >
          <template
            v-if="
              currentForm === SESSION_FORMS.REGISTER ||
              currentForm === SESSION_FORMS.GUEST
            "
            #footer
          >
            <TermsAndConditions
              class="text-muted text-sm"
              :label="t('action.continue_label')"
            />
          </template>
        </Form>
      </div>

      <div
        v-if="meta.showLoginForm && !meta.show2fa"
        :class="styles.session.auth.actions"
      >
        <slot name="toggle">
          <Link
            @click="toggleForm('recover')"
            color="muted"
            :label="t('auth.forgot_password_qn')"
            size="lg"
            data-testid="forgot-password-link"
          />
        </slot>
      </div>

      <template v-if="meta.showVerifyEmailForm">
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
            <template v-if="meta.canResend">
              <span :class="styles.session.auth.resendPrompt">
                {{ t("auth.didnt_receive_code") }}
              </span>

              <Link
                size="sm"
                :label="t('action.resend_code')"
                @click.prevent="resendVerification"
              />
            </template>

            <span
              v-else-if="meta.isResending"
              :class="styles.session.auth.resendSending"
            >
              {{ t("auth.verify_email_send") }}
            </span>
            <span
              v-else-if="meta.resendComplete"
              :class="styles.session.auth.resendSent"
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
// --- external
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
// --- internal
import TermsAndConditions from "../../brand/TermsAndConditions.vue";
import Form from "../../../components/form/Form.vue";
import config from "../session.config";
import { useSession } from "@upmind-automation/headless";
import {
  useStyles,
  cn,
  Interstitial,
  Slot,
  type FormActionProps
} from "@upmind-automation/upmind-ui";

// --- custom elements
import { Alert, Button, Link } from "@upmind-automation/upmind-ui";

// --- utils
import { find, get, map } from "lodash-es";

// --- types
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

const {
  isReady,
  meta,
  errors,
  validationErrors,
  showLogin,
  showRegister,
  showRecoverPassword,
  showVerifyEmail,
  model,
  schema,
  uischema,
  resolve,
  reject,
  setModel,
  resendVerification
} = useSession();

const styles = useStyles(
  [
    "session.auth",
    "session.transitions.fade.enter",
    "session.transitions.fade.leave"
  ],
  meta,
  config
);

const currentForm = computed<SESSION_FORMS>(() => {
  // An unverified client owes email verification (sourced from the client
  // machine); it isn't in any guest/login/register state.
  if (meta.value.showVerifyEmailForm) return SESSION_FORMS.VERIFY;
  // A guest client upgrading is its own form (sourced from the client machine);
  // it shares the register fields but has a distinct submit label/flow.
  if (meta.value.showGuestUpgradeForm) return SESSION_FORMS.GUEST;
  if (meta.value.showLoginForm) return SESSION_FORMS.LOGIN;
  if (meta.value.showRegisterForm) return SESSION_FORMS.REGISTER;
  if (meta.value.showRecoverPasswordForm) return SESSION_FORMS.RECOVER;
  return SESSION_FORMS.UNKNOWN;
});

// Keyed so <Transition> fades between resend messages — the wrapper is
// otherwise the same element across states and would patch in place.
const resendState = computed(() => {
  if (meta.value.canResend) return "prompt";
  if (meta.value.isResending) return "sending";
  if (meta.value.resendComplete) return "sent";
  if (meta.value.resendFailed) return "failed";
  return "";
});

const twofaI18nKey = computed(() => {
  if (!meta.value.show2fa || !uischema.value) return "form.twofa";
  const element = find((uischema.value as any).elements, {
    scope: "#/properties/token"
  });
  return get(element, "i18n", "form.twofa");
});

const interstitialTitle = computed(() =>
  meta.value.showVerifyEmailForm
    ? t("auth.verify_email_title")
    : t(`${twofaI18nKey.value}.label`)
);

const interstitialText = computed(() =>
  meta.value.showVerifyEmailForm
    ? t("auth.verify_email_msg")
    : t(`${twofaI18nKey.value}.description`)
);

const modal2faUischema = computed(() => {
  if (!meta.value.show2fa || !uischema.value) return uischema.value;
  return {
    ...uischema.value,
    elements: map((uischema.value as any).elements, (el: any) =>
      el.scope === "#/properties/token"
        ? {
            ...el,
            i18n: undefined,
            label: "",
            options: {
              ...el.options,
              size: "lg",
              align: "center"
            }
          }
        : el
    )
  };
});

const formUischema = computed(() =>
  meta.value.show2fa ? modal2faUischema.value : uischema.value
);

const formActions = computed(() => {
  let label: string;
  switch (currentForm.value) {
    case SESSION_FORMS.LOGIN:
      label = t("action.log_in_to_your_account");
      break;
    case SESSION_FORMS.GUEST:
      label = t("action.register");
    case SESSION_FORMS.RECOVER:
      label = t("action.send_reset");
    case SESSION_FORMS.VERIFY:
      label = t("action.verify");
    case SESSION_FORMS.REGISTER:
    default:
      label = t("action.continue_label");
  }

  const actions: Record<string, FormActionProps> = {
    submit: {
      type: "submit" as const,
      label,
      block: true,
      needsValid: true,
      size: "lg" as const
    }
  };

  if (meta.value.show2fa || meta.value.showVerifyEmailForm) {
    actions.cancel = {
      type: "reset" as const,
      label: meta.value.showVerifyEmailForm
        ? t("action.continue_shopping")
        : t("action.cancel"),
      block: true,
      size: "lg",
      variant: "link",
      ...(meta.value.showVerifyEmailForm ? {} : (props.storefrontRoute ?? {}))
    };

    // add the storefront route to the cancel action if its provided
    //  usually only use din verify email but its a possibility for others as well
    if (props.storefrontRoute) {
      actions.cancel = {
        ...actions.cancel,
        ...props.storefrontRoute
      } as FormActionProps;
    }
  }
  return actions;
});

// ---

const alertTitle = computed(() => {
  if (meta.value.resendFailed) return t("error.session_resend_failed");

  switch (currentForm.value) {
    case SESSION_FORMS.REGISTER:
    case SESSION_FORMS.GUEST:
      return t("error.session_register_failed");
    case SESSION_FORMS.RECOVER:
      return t("error.session_recover_failed");
    case SESSION_FORMS.LOGIN:
      return t("error.session_login_failed");
    case SESSION_FORMS.VERIFY:
      return t("error.session_verify_failed");
  }
});

// ---

async function toggleForm(type: SessionProps["modelValue"]) {
  switch (type) {
    case SESSION_FORMS.LOGIN:
      if (!meta.value.showLoginForm) {
        showLogin().then(() => {
          if (modelValue.value !== SESSION_FORMS.LOGIN)
            modelValue.value = SESSION_FORMS.LOGIN;
        });
      }
      break;
    case SESSION_FORMS.REGISTER:
      if (!meta.value.showRegisterForm && !meta.value.showGuestUpgradeForm) {
        showRegister().then(() => {
          if (modelValue.value !== SESSION_FORMS.REGISTER)
            modelValue.value = SESSION_FORMS.REGISTER;
        });
      }
      break;
    case SESSION_FORMS.RECOVER:
      if (!meta.value.showRecoverPasswordForm) {
        showRecoverPassword().then(() => {
          if (modelValue.value !== SESSION_FORMS.RECOVER)
            modelValue.value = SESSION_FORMS.RECOVER;
        });
      }
      break;
    case SESSION_FORMS.VERIFY:
      if (!meta.value.showVerifyEmailForm) {
        showVerifyEmail().then(() => {
          if (modelValue.value !== SESSION_FORMS.VERIFY)
            modelValue.value = SESSION_FORMS.VERIFY;
        });
      }
      break;
  }
}

function doResolve(model: any) {
  resolve(model).then(success => {
    if (success) emit("resolve", model);
  });
}

function doReject() {
  reject().then(() => emit("reject"));
}

onMounted(() => {
  toggleForm(modelValue.value);
});

// --- esc key handler for 2fa modal
watch(
  () => meta.value.show2fa,
  value => {
    if (value) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") doReject();
      };
      document.addEventListener("keydown", handler);
      watch(
        () => meta.value.show2fa,
        still => {
          if (!still) document.removeEventListener("keydown", handler);
        }
      );
    }
  }
);

watch(
  meta,
  (
    { canShowForms, isAuthenticated },
    { isAuthenticated: wasAuthenticated, canShowForms: couldShowForms }
  ) => {
    // Only toggle on initial canShowForms becoming true, not on every meta change
    if (canShowForms && !couldShowForms) toggleForm(modelValue.value);
    // NB ensure we only emit resolve when the user has just logged in
    if (isAuthenticated && !wasAuthenticated) {
      emit("resolve", model.value);
    }
  }
);

watch(modelValue, newValue => {
  toggleForm(newValue);
});

// Auth's loading state hides the form before the parent renders the
// post-auth view — all within the same route, so the router's scrollBehavior
// doesn't fire. Scroll while the section is off-screen so the next page
// lands at the top.
watch(
  () => meta.value.isLoading,
  (isLoading, wasLoading) => {
    if (isLoading && !wasLoading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
);
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
