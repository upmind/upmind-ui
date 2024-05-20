<template>
  <component
    :is="dialog ? 'upw-dialog' : 'section'"
    @reject="onClose"
    size="xl"
    :actions="actions"
    :title="$tc(`client.${i18nKey}.form.title`, meta.isNew ? 1 : 0)"
    :model-value="dialog"
    @update:modelValue="onClose"
  >
    <upw-form
      tabindex="1"
      :class="styles.clientForm.root"
      :loading="meta.isLoading"
      :processing="meta.isProcessing"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      @update:modelValue="input"
      @valid="maybeSubmit"
      @reject="onClose"
      @resolve="onUpdate"
      :actions="actions"
      :no-actions="dialog"
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
import { UpwForm, UpwDialog } from "@upmind/upwind";
import { isEmpty } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientForm",
  components: { UpwForm, UpwDialog },
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
          disabled: this.meta.isProcessing,
          action: () => this.cancel(),
        },

        submit: {
          type: "submit",
          variant: this.dialog ? "flat" : "link",
          label: this?.$tc(
            `client.${this.i18nKey}.actions.submit`,
            this.model?.company_details ? 0 : 1
          ),
          disabled: !this.meta.isValid || this.meta.isProcessing,
          action: ({ model }) => this.update(model),
        },
      };

      return this.dialog ? actions : null;
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
      if (this.autosave && isValid && !isEmpty(this.model)) {
        this.$nextTick(() => {
          this.update(this.model);
        });
      }
    },
  },
});
</script>
