<template>
  <section v-if="!meta.isAuthenticated && !meta.isLoading">
    <component
      :is="meta.show2fa ? Interstitial : Slot"
      v-if="!meta.isAuthenticated && !meta.isLoading"
      :open="meta.show2fa"
      modal
      :title="twofaTitle"
      :text="twofaText"
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
          :disabled="meta.isAuthenticated"
          :key="currentForm"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :model-value="model"
          :schema="schema"
          :uischema="modal2faUischema"
          :additional-errors="validationErrors"
          :variant="variant"
          @reject="doReject"
          @resolve="doResolve"
          @update:model-value="setModel"
          :class="cn(styles.session.auth.form, meta.show2fa && 'mt-4')"
          :actions="meta.show2fa ? twoFactorActions : authActions"
          :data-testid="`${currentForm}-form`"
        >
          <template v-if="currentForm === 'register'" #footer>
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
  Slot
} from "@upmind-automation/upmind-ui";

// --- custom elements
import { Alert, Button, Link } from "@upmind-automation/upmind-ui";

// --- utils
import { find, get, map } from "lodash-es";

// --- types
import type { SessionProps } from "../types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["resolve", "reject"]);
const props = withDefaults(defineProps<Omit<SessionProps, "modelValue">>(), {
  variant: "solid"
});

const modelValue = defineModel<SessionProps["modelValue"]>("modelValue", {
  default: "login"
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
  setModel
} = useSession();

// await isReady();

const styles = useStyles(["session.auth"], meta, config);

const currentForm = computed(() => {
  return meta.value.showLoginForm
    ? "login"
    : meta.value.showRegisterForm
      ? "register"
      : meta.value.showRecoverPasswordForm
        ? "recover"
        : "unknown";
});

// --- 2fa

const twofaI18nKey = computed(() => {
  if (!meta.value.show2fa || !uischema.value) return "form.twofa";
  const element = find((uischema.value as any).elements, {
    scope: "#/properties/token"
  });
  return get(element, "i18n", "form.twofa");
});

const twofaTitle = computed(() => t(`${twofaI18nKey.value}.label`));
const twofaText = computed(() => t(`${twofaI18nKey.value}.description`));

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

// ---

const alertTitle = computed(() => {
  switch (currentForm.value) {
    case "register": {
      return t("form.register.error");
    }
    case "recover": {
      return t("form.recover.error");
    }
    case "login": {
      return t("form.login.error");
    }
  }
});

// ---

const authActions = computed(() => {
  return {
    submit: {
      type: "submit" as const,
      label: meta.value.showLoginForm
        ? t("action.log_in_to_your_account")
        : meta.value.showRegisterForm
          ? t("action.continue_label")
          : meta.value.showRecoverPasswordForm
            ? t("action.send_reset")
            : t("action.continue_label"),
      block: true,
      needsValid: true,
      size: "lg" as const
    }
  };
});
const twoFactorActions = computed(() => {
  return {
    submit: {
      type: "submit" as const,
      label: meta.value.showLoginForm
        ? t("action.log_in_to_your_account")
        : meta.value.showRegisterForm
          ? t("action.continue_label")
          : meta.value.showRecoverPasswordForm
            ? t("action.send_reset")
            : t("action.continue_label"),
      block: true,
      needsValid: true,
      size: "lg" as const
    },
    cancel: {
      type: "reset" as const,
      label: t("action.cancel"),
      block: true,
      size: "lg" as const,
      variant: "link"
    }
  };
});

function toggleForm(type: SessionProps["modelValue"]) {
  if (!meta.value.canShowForms) return;

  switch (type) {
    case "login":
      if (!meta.value.showLoginForm) {
        showLogin().then(() => {
          if (modelValue.value !== "login") modelValue.value = "login";
        });
      }
      break;
    case "register":
      if (!meta.value.showRegisterForm) {
        showRegister().then(() => {
          if (modelValue.value !== "register") modelValue.value = "register";
        });
      }
      break;
    case "recover":
      if (!meta.value.showRecoverPasswordForm) {
        showRecoverPassword().then(() => {
          if (modelValue.value !== "recover") modelValue.value = "recover";
        });
      }
      break;
  }
}

function doResolve(model: any) {
  resolve(model).then(success => {
    if (success) {
      emit("resolve", model);
    }
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
  show2fa => {
    if (show2fa) {
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
