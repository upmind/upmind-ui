<template>
  <section v-if="meta.canShowForms && !meta.isLoading">
    <component
      :is="meta.show2fa || meta.showVerifyEmail ? Interstitial : Slot"
      v-if="meta.canShowForms && !meta.isLoading"
      :open="meta.show2fa || meta.showVerifyEmail"
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
            !meta.showVerifyEmail
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

          <template v-if="currentForm === SESSION_FORMS.VERIFY">
            <p :class="styles.session.auth.resend">
              <span>{{ t("auth.didnt_receive_code") }}</span>
              <Link
                size="sm"
                :label="verifyResendLabel"
                :disabled="meta.isCoolingDown"
                @click.prevent="resendVerification"
              />
            </p>
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
  model,
  schema,
  uischema,
  resolve,
  reject,
  logout,
  setModel,
  challengeEmail,
  verifyEmail,
  resendVerification,
  verificationResendCooldown
} = useSession();

// await isReady();

const styles = useStyles(["session.auth"], meta, config);

const currentForm = computed<SESSION_FORMS>(() => {
  // An unverified client owes email verification (sourced from the client
  // machine); it isn't in any guest/login/register state.
  if (meta.value.showVerifyEmail) return SESSION_FORMS.VERIFY;
  // A guest client upgrading is its own form (sourced from the client machine);
  // it shares the register fields but has a distinct submit label/flow.
  if (meta.value.showGuestUpgradeForm) return SESSION_FORMS.GUEST;
  if (meta.value.showLoginForm) return SESSION_FORMS.LOGIN;
  if (meta.value.showRegisterForm) return SESSION_FORMS.REGISTER;
  if (meta.value.showRecoverPasswordForm) return SESSION_FORMS.RECOVER;
  return SESSION_FORMS.UNKNOWN;
});

const twofaI18nKey = computed(() => {
  if (!meta.value.show2fa || !uischema.value) return "form.twofa";
  const element = find((uischema.value as any).elements, {
    scope: "#/properties/token"
  });
  return get(element, "i18n", "form.twofa");
});

const interstitialTitle = computed(() =>
  meta.value.showVerifyEmail
    ? t("auth.verify_email_title")
    : t(`${twofaI18nKey.value}.label`)
);

const interstitialText = computed(() =>
  meta.value.showVerifyEmail
    ? t("auth.verify_email_msg")
    : t(`${twofaI18nKey.value}.description`)
);

const verifyResendLabel = computed(() =>
  meta.value.isCoolingDown
    ? t("action.resend_code_in", { seconds: verificationResendCooldown.value })
    : t("action.resend_code")
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

  if (meta.value.show2fa || meta.value.showVerifyEmail) {
    actions.cancel = {
      type: "reset" as const,
      label: meta.value.showVerifyEmail
        ? t("action.continue_shopping")
        : t("action.cancel"),
      block: true,
      size: "lg",
      variant: "link",
      ...(meta.value.showVerifyEmail ? {} : (props.storefrontRoute ?? {}))
    };
  }
  return actions;
});

// ---

const alertTitle = computed(() => {
  switch (currentForm.value) {
    case SESSION_FORMS.REGISTER:
    case SESSION_FORMS.GUEST:
      return t("form.register.error");
    case SESSION_FORMS.RECOVER:
      return t("form.recover.error");
    case SESSION_FORMS.LOGIN:
      return t("form.login.error");
    case SESSION_FORMS.VERIFY:
      return t("form.verify_email.error");
  }
});

// ---

function toggleForm(type: SessionProps["modelValue"]) {
  if (!meta.value.canShowForms) return;

  // An unverified client always routes to the verify-email challenge,
  // regardless of the requested mode — they can't use any other form.
  if (meta.value.isUnverified) {
    if (!meta.value.showVerifyEmail) challengeEmail();
    return;
  }

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
      if (!meta.value.showRecoverPasswordForm) {
        showRecoverPassword().then(() => {
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

// // --- esc key handler for 2fa modal
// watch(
//   () => meta.value.show2fa,
//   show2fa => {
//     if (show2fa) {
//       const handler = (e: KeyboardEvent) => {
//         if (e.key === "Escape") doReject();
//       };
//       document.addEventListener("keydown", handler);
//       watch(
//         () => meta.value.show2fa,
//         still => {
//           if (!still) document.removeEventListener("keydown", handler);
//         }
//       );
//     }
//   }
// );

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
