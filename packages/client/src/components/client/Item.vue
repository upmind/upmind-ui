<template>
  <component
    :is="dialog ? 'upw-dialog' : 'section'"
    @reject="cancel"
    :title="$tc(`client.${i18nKey}.form.title`, meta.isNew ? 1 : 0)"
    size="xl"
    :actions="actions"
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
      @reject="cancel"
      @resolve="update"
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
      const actions = {};

      if (this.dialog) {
        actions.cancel = {
          label: "Cancel",
          variant: "link",
          disabled: this.meta.isProcessing,
          action: () => this.cancel(),
        };

        actions.submit = {
          type: "submit",
          variant: this.dialog ? "flat" : "link",
          label: "Confirm Address",
          disabled: !this.meta.isValid || this.meta.isProcessing,
          action: ({ model }) => this.update(model),
        };
      }

      return actions;
    },
  },
  methods: {
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
