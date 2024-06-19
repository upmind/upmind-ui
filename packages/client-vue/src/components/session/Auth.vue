<template>
  <div class="auth" :class="styles.auth.root" v-if="!meta.isAuthenticated">
    <upw-tabs
      :tabs="tabs"
      v-model="active"
      @update:modelValue="toggleForm"
      size="sm"
      v-if="
        !noTabs &&
        (meta.canShowForms || meta.showLoginForm || meta.showRegisterForm)
      "
    />

    <upw-form
      :key="active"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :additional-errors="errors?.data"
      @reject="reject"
      @resolve="resolve"
      :class="styles.auth.form"
      :actions="authActions"
    >
    </upw-form>
  </div>
  <upw-button variant="ghost" block type="reset" @click.prevent="logout" v-else>
    logout
  </upw-button>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useSession } from "@upmind/flow-vue";
import { UpwForm, UpwTabs, UpwButton } from "@upmind/upwind";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- types
import type { PropType } from "vue";
import type { AuthProps } from "./types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmAuth",
  components: { UpwForm, UpwTabs, UpwButton },

  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String as PropType<AuthProps["form"]>,
      default: "login",
    },
    noTabs: { type: Boolean, default: false },
  },
  setup(props) {
    const session = useSession();

    const styles = useStyles(["auth"], session.meta, config);

    return {
      ...session,
      styles,
      active: ref(props.modelValue),
    };
  },
  computed: {
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
    tabs() {
      return [
        {
          value: "register",
          label: this.$t("auth.register"),
        },
        {
          value: "login",
          label: this.$t("auth.login"),
        },
      ];
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
        case "2fa":
          if (!this.meta.show2fa) this.show2fa();
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
