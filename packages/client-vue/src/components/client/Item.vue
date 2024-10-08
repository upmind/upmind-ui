<template>
  <component
    :is="modal ? 'Dialog' : 'section'"
    @reject="onClose"
    :actions="actions"
    :title="safeTitle"
    :open="modal"
    @update:open="onClose"
    size="2xl"
    skrim="light"
  >
    <UpwForm
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

    <template #actions>
      <Button
        v-for="(action, key) in actions"
        :key="key"
        v-bind="action"
        :loading="action.loading"
        :disabled="action?.disabled"
        @click="doAction(action)"
      />
    </template>
  </component>
</template>

<script>
// --- external
import { defineComponent, inject } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwForm, Button } from "@upmind/upwind";
import { isEmpty, omit } from "lodash-es";

// --- custom elements
import { Dialog } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientForm",
  components: { UpwForm, Dialog, Button },
  props: {
    modelValue: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    modal: { type: Boolean, default: true },
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
          handler: () => this.cancel(),
        },

        submit: {
          type: "submit",
          variant: "flat",
          label: this?.$tc(
            `client.${this.i18nKey}.actions.submit`,
            this.model?.company_details ? 0 : 1
          ),
          disabled: !this?.meta?.isValid || this?.meta?.isProcessing,
          handler: ({ model }) => this.update(model),
        },
      };

      return this.modal ? actions : omit(actions, "cancel");
    },
    hideActions() {
      // always hide actions in modal,
      // always show the actions if we are not autosaving
      // otherwise, if we have autosave,
      //            and the user chooses to manually enter the address,
      //            or the place is missing info (e.g. no street address)
      // then show the actions
      if (this.modal) return true;
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
      this.$emit("update:open", false);
      this.cancel();
    },
    onUpdate(model) {
      this.$emit("update:open", false);
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
    doAction(item) {
      if (isFunction(item?.handler)) {
        item.handler();
      }
    },
  },
});
</script>
