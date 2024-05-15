<template>
  <component
    :is="dialog ? 'upw-dialog' : 'div'"
    @reject="cancel"
    :title="$tc(`client.${i18nKey}.form.title`, meta.isNew ? 1 : 0)"
    size="xl"
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
      @reject="cancel"
      @resolve="update"
      :actions="actions"
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

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientForm",
  components: { UpwForm, UpwDialog },
  props: {
    item: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    dialog: { type: Boolean, default: true },
  },
  setup(props) {
    const useClient = inject("client");
    const clientForm = useClient(props.item);
    const styles = useStyles(["clientForm"], clientForm.meta, config);

    return {
      styles,
      ...clientForm,
    };
  },

  computed: {
    actions() {
      const actions = {
        submit: {
          type: "submit",
          label: "Save",
          disabled: !this.meta.isValid || this.meta.isProcessing,
        },
      };

      if (this.dialog) {
        actions.cancel = {
          label: "Cancel",
          variant: "ghost",
          disabled: this.meta.isProcessing,
          action: this.cancel,
        };
      }

      return actions;
    },
  },
});
</script>
