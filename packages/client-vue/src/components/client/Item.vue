<template>
  <component
    :is="dialog ? 'uw-dialog' : 'section'"
    @reject="onClose"
    size="xl"
    :actions="actions"
    :title="safeTitle"
    :model-value="dialog"
    @update:modelValue="onClose"
  >
    <upw-form
      slot="content"
      :class="styles.clientForm.root"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      @update:modelValue="input"
      @valid="maybeSubmit"
      @reject="onClose"
      @resolve="onUpdate"
      :actions="actions"
      :no-actions="hideActions"
    />
  </component>
</template>

<script>
// --- external
import { defineComponent, inject } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwForm } from "@upmind/upwind";
import { isEmpty, omit } from "lodash-es";

// --- custom elements
import { UwDialog, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDialog);

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientForm",
  components: { UpwForm },
  props: {
    modelValue: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    dialog: { type: Boolean, default: true },
    autosave: { type: Boolean, default: false },
  },
  setup(props) {
    const useClient = inject("client");
    const clientForm = useClient(props.modelValue);
    const styles = useStyles(["clientForm"], clientForm.meta, config);

    return {
      styles,
      ...clientForm,
    };
  },

  computed: {
    actions() {
      const actions = {
        cancel: {
          label: this?.$t(`client.${this.i18nKey}.actions.cancel`),
          variant: "link",
          disabled: this?.meta?.isProcessing,
          action: () => this.cancel(),
        },

        submit: {
          type: "submit",
          variant: "flat",
          label: this?.$tc(
            `client.${this.i18nKey}.actions.submit`,
            this.model?.company_details ? 0 : 1
          ),
          disabled: !this?.meta?.isValid || this?.meta?.isProcessing,
          action: ({ model }) => this.update(model),
        },
      };

      return this.dialog ? actions : omit(actions, "cancel");
    },
    hideActions() {
      // always hide actions in dialog,
      // always show the actions if we are not autosaving
      // otherwise, if we have autosave,
      //            and the user chooses to manually enter the address,
      //            or the place is missing info (e.g. no street address)
      // then show the actions
      if (this.dialog) return true;
      if (!this.autosave) return false;
      return !this.model?.manualPlace;
    },
    safeTitle() {
      if (this.model?.company_details) {
        return this.$tc(
          `client.${this.i18nKey}.form.title.company`,
          this?.meta?.isNew ? 1 : 0
        );
      }

      return this.$tc(
        `client.${this.i18nKey}.form.title.address`,
        this?.meta?.isNew ? 1 : 0
      );
    },
  },
  methods: {
    onClose() {
      this.$emit("update:modelValue", false);
      this.cancel();
    },
    onUpdate(model) {
      this.$emit("update:modelValue", false);
      this.update(model);
    },

    maybeSubmit(isValid) {
      if (
        this.autosave &&
        isValid &&
        !isEmpty(this.model) &&
        !this.model.manualPlace
      ) {
        this.$nextTick(() => {
          this.update(this.model);
        });
      }
    },
  },
});
</script>
