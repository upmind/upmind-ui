<template>
  <component
    :is="modal ? 'upw-dialog' : 'div'"
    @reject="cancel"
    :title="$tc(`client.${i18nKey}.form.title`, meta.isNew ? 1 : 0)"
    size="lg"
  >
    <upw-form
      tabindex="1"
      ref="form"
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
import { defineComponent, inject, ref } from "vue";

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
    modal: { type: Boolean, default: true },
  },
  setup(props) {
    const useClient = inject("client");
    const clientForm = useClient(props.item);
    const styles = useStyles(["clientForm"], clientForm.meta, config);

    return {
      form: ref(),
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

      if (this.modal) {
        actions.cancel = {
          label: "Cancel",
          variant: "ghost",
          disabled: this.meta.isProcessing,
        };
      }

      return actions;
    },
  },
  mounted() {
    this.$nextTick(() => {
      const yOffset = -108;
      const y =
        this.form.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
      this.form.focus();
    });
  },
});
</script>
