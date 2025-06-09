<template>
  <div
    class="auth"
    :class="cn(styles.session.auth.root, $props.class)"
    v-if="!meta.isAuthenticated && !meta.isLoading"
    v-auto-animate
  >
    <Alert
      v-if="meta.hasErrors"
      color="error"
      icon="alert-triangle"
      :title="t(`session.${modelValue}.error`)"
      :description="errors?.message"
    />

    <Form
      :key="modelValue"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      :additional-renderers="formRenderers"
      :color="color"
      @reject="doReject"
      @resolve="doResolve"
      @update:model-value="setModel"
      :class="styles.session.auth.form"
      :actions="authActions"
    />
  </div>

  <div v-if="!meta.isLoading" :class="styles.session.auth.actions">
    <slot name="toggle">
      <Link
        v-if="!meta.isAuthenticated && meta.showLoginForm"
        @click="toggleForm('recover')"
      >
        <span class="font-normal">
          {{ buttons.recover.label }}
        </span>
      </Link>
    </slot>
    <Button
      v-if="meta.isAuthenticated"
      variant="ghost"
      block
      type="reset"
      @click.prevent="logout"
    >
      logout
    </Button>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import Form from "../../../components/form/Form.vue";
import { formRenderers } from "../../../components/form";
import config from "../sesssion.config";
import {
  ROUTE,
  useSession,
  useRoutingEngine,
} from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Link, Alert, Button } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { AuthProps } from "./types";
// -----------------------------------------------------------------------------

const emit = defineEmits(["update:modelValue", "resolve", "reject"]);
const props = withDefaults(defineProps<AuthProps>(), {
  modelValue: "login",
  color: "secondary",
});

const { t } = useI18n();

const {
  isReady,
  meta,
  errors,
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
} = useSession();

await isReady();

const styles = useStyles(["session.auth"], meta, config) as ComputedRef<{
  session: {
    auth: {
      root: string;
      form: string;
      actions: string;
    };
  };
}>;

const modelValue = useVModel(props, "modelValue", emit);

// ---

const buttons = computed(() => {
  return {
    register: {
      label: t("session.register.actions.text"),
      action: t("session.register.actions.action"),
    },
    login: {
      label: t("session.login.actions.text"),
      action: t("session.login.actions.action"),
    },
    recover: {
      label: t("session.recover.actions.text"),
      action: t("session.recover.actions.action"),
    },
  };
});

const authActions = computed(() => {
  return {
    submit: {
      type: "submit" as "submit",
      label: meta.value.showLoginForm
        ? t("auth.actions.login")
        : meta.value.showRegisterForm
          ? t("auth.actions.register")
          : meta.value.showRecoverPasswordForm
            ? t("auth.actions.recover")
            : t("auth.actions.continue"),
      block: true,
      needsValid: true,
    },
  };
});

function toggleForm(type: AuthProps["modelValue"]) {
  // if (meta.value.isAuthenticated) return;

  switch (type) {
    case "login":
      if (!meta.value.showLoginForm) {
        showLogin().then(() => (modelValue.value = type));
      }
      break;
    case "register":
      if (!meta.value.showRegisterForm) {
        showRegister().then(() => (modelValue.value = type));
      }
      break;
    case "recover":
      if (!meta.value.showRecoverPasswordForm) {
        showRecoverPassword().then(() => (modelValue.value = type));
      }
      break;
  }
}

function doResolve(model: any) {
  resolve(model).then(() => emit("resolve", model));
}

function doReject() {
  reject().then(() => emit("reject"));
}

onMounted(() => {
  toggleForm(modelValue.value);
});

watch(meta, ({ canShowForms, isAuthenticated }) => {
  if (canShowForms) toggleForm(modelValue.value);
  if (isAuthenticated) {
    emit("resolve", model.value);
  }
});
</script>
