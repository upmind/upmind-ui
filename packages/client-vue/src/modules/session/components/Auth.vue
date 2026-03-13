<template>
  <section v-if="!meta.isAuthenticated && !meta.isLoading">
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
        :uischema="uischema"
        :additional-errors="validationErrors"
        :variant="variant"
        @reject="doReject"
        @resolve="doResolve"
        @update:model-value="setModel"
        :class="styles.session.auth.form"
        :actions="authActions"
      >
        <template v-if="currentForm === 'register'" #footer>
          <TermsAndConditions
            class="text-muted text-sm"
            :label="t('action.continue_label')"
          />
        </template>
      </Form>
    </div>

    <div v-if="meta.showLoginForm" :class="styles.session.auth.actions">
      <slot name="toggle">
        <Link
          @click="toggleForm('recover')"
          color="muted"
          :label="t('auth.forgot_password_qn')"
          size="lg"
        />
      </slot>
    </div>
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
import { useStyles, cn } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Alert, Button, Link } from "@upmind-automation/upmind-ui";

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

function toggleForm(type: SessionProps["modelValue"]) {
  // if (meta.value.isAuthenticated) return;

  if (!meta.value.canShowForms) return;

  switch (type) {
    case "login":
      if (!meta.value.showLoginForm) {
        showLogin().then(() => (modelValue.value = "login"));
      }
      break;
    case "register":
      if (!meta.value.showRegisterForm) {
        showRegister().then(() => (modelValue.value = "register"));
      }
      break;
    case "recover":
      if (!meta.value.showRecoverPasswordForm) {
        showRecoverPassword().then(() => (modelValue.value = "recover"));
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

watch(
  meta,
  (
    { canShowForms, isAuthenticated },
    { isAuthenticated: wasAuthenticated }
  ) => {
    if (canShowForms) toggleForm(modelValue.value);
    // NB ensure we only emit resolve when the user has just logged in
    if (isAuthenticated && !wasAuthenticated) {
      emit("resolve", model.value);
    }
  }
);

watch(modelValue, newValue => {
  toggleForm(newValue);
});
</script>

<style>
.grecaptcha-badge {
  visibility: hidden;
}
</style>
