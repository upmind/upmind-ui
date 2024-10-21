<template>
  <div
    class="auth"
    :class="styles.session.auth.root"
    v-if="!meta.isAuthenticated"
  >
    <Tabs
      :default-value="modelValue"
      :tabs="tabs"
      :width="stretchTabs ? 'full' : 'auto'"
      v-if="
        !noTabs &&
        (meta.canShowForms || meta.showLoginForm || meta.showRegisterForm)
      "
    />

    <Form
      :key="active"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      :color="color"
      @reject="reject"
      @resolve="resolve"
      :class="styles.session.auth.form"
      :actions="authActions"
    >
    </Form>
  </div>
  <Button variant="ghost" block type="reset" @click.prevent="logout" v-else>
    logout
  </Button>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useSession } from "@upmind/headless-vue";
import { Form } from "@upmind/upwind";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { Button, Tabs, type TabItems } from "@upmind/upwind";

// --- types
import type { PropType } from "vue";
import type { AuthProps } from "./types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmAuth",
  components: { Form, Tabs, Button },

  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String as PropType<AuthProps["form"]>,
      default: "login",
    },
    noTabs: { type: Boolean, default: false },
    blockTabs: { type: Boolean, default: false },
    stretchTabs: { type: Boolean, default: false },
    color: { type: String },
  },
  setup(props) {
    const {
      meta,
      errors,
      showLogin,
      showRegister,
      verify2fa,
      model,
      schema,
      uischema,
      resolve,
      reject,
    } = useSession();

    const styles = useStyles(["session.auth"], meta, config);

    return {
      meta,
      errors,
      styles,
      active: ref(props.modelValue),
      // ---
      model,
      schema,
      uischema,
      // ---
      resolve,
      reject,
      showLogin,
      showRegister,
      verify2fa,
    };
  },
  computed: {
    tabs(): TabItems {
      return [
        {
          value: "register",
          label: this.$t("auth.actions.toggle.register"),
        },
        {
          value: "login",
          label: this.$t("auth.actions.toggle.login"),
        },
      ];
    },
    authActions() {
      const actions = {
        submit: {
          type: "submit",
          label: this.meta.showLoginForm
            ? this.$t("auth.actions.login")
            : this.meta.showRegisterForm
              ? this.$t("auth.actions.register")
              : this.$t("auth.actions.continue"),
          block: true,
          needsValid: true,
        },
      };

      // TODO: implement forgot password flow
      // if (this.meta.showLoginForm) {
      //   actions.forgot = {
      //     label: this.$t("auth.actions.forgot"),
      //     block: true,
      //     variant: "link",
      //     size: "sm",
      //     action: () => this.toggleForm("forgot"),
      //   };
      // }

      return actions;
    },
  },
  methods: {
    toggleForm(type: AuthProps.form) {
      switch (type) {
        case "login":
          if (!this.meta.showLoginForm) this.showLogin();
          break;
        case "register":
          if (!this.meta.showRegisterForm) this.showRegister();
          break;
      }

      this.active = type;
      this.$emit("update:modelValue", type);
    },
  },
  mounted() {
    this.toggleForm(this.active);
  },
  watch: {
    meta({ canShowForms }) {
      if (canShowForms) {
        this.toggleForm(this.active);
      }
    },
  },
});
</script>
