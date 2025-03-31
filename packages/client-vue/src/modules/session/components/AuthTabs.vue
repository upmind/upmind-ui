<template>
  <div
    class="auth"
    :class="cn(styles.session.auth.root, $props.class)"
    v-if="!meta.isAuthenticated && !meta.isLoading"
  >
    <Tabs
      :default-value="modelValue"
      :value="modelValue"
      :tabs="tabs"
      :width="stretchTabs ? 'full' : 'auto'"
      v-if="
        !noTabs &&
        (meta.canShowForms || meta.showLoginForm || meta.showRegisterForm)
      "
    />

    <Form
      :key="modelValue"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      :color="color"
      @reject="doReject"
      @resolve="doResolve"
      :class="styles.session.auth.form"
      :actions="authActions"
    />
  </div>

  <div
    v-if="meta.isAuthenticated && !meta.isLoading"
    :class="styles.session.auth.actions"
  >
    <slot name="toggle" v-if="meta.showRegisterForm || meta.showLoginForm">
      <Button variant="ghost" block type="reset" @click.prevent="logout">
        logout
      </Button>
    </slot>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import Form from "../../../components/form/Form.vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../sesssion.config";

// --- custom elements
import { Button, Tabs } from "@upmind-automation/upmind-ui";

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
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
  model,
  schema,
  uischema,
  resolve,
  reject,
  logout,
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

const tabs = computed((): TabItem[] => {
  return [
    {
      value: "register",
      label: t("auth.actions.toggle.register"),
    },
    {
      value: "login",
      label: t("auth.actions.toggle.login"),
    },
  ];
});

const authActions = computed(() => {
  return {
    submit: {
      type: "submit" as "submit",
      label: meta.value.showLoginForm
        ? t("auth.actions.login")
        : meta.value.showRegisterForm
          ? t("auth.actions.register")
          : t("auth.actions.continue"),
      block: true,
      needsValid: true,
    },
  };

  // TODO: implement forgot password flow
  // if (this.meta.showLoginForm) {
  //   actions.forgot = {
  //     label: this.t("auth.actions.forgot"),
  //     block: true,
  //     variant: "link",
  //     size: "sm",
  //     action: () => this.toggleForm("forgot"),
  //   };
  // }
});

function toggleForm(type: AuthProps["modelValue"]) {
  if (meta.value.isLoading) return;

  switch (type) {
    case "login":
      if (!meta.value.showLoginForm)
        showLogin().then(() => (modelValue.value = type));
      break;
    case "register":
      if (!meta.value.showRegisterForm)
        showRegister().then(() => (modelValue.value = type));
      break;
    // case "forgot":
    //   if (!meta.value.showForgotForm)
    //     showForgot().then(() => (modelValue.value = type));
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

watch(meta, ({ canShowForms }) => {
  if (canShowForms) {
    toggleForm(modelValue.value);
  }
});
</script>
