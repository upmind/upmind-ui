<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'Drawer' : 'section'"
    :title="safeTitle"
    :open="isOpen"
    :actions="actions"
    :skrim="color"
    :class="styles.clientForm.root"
    :class-footer="styles.clientForm.footer"
    fit="cover"
    v-auto-animate
    @reject="onClose"
    @update:open="onClose"
    size="2xl"
  >
    <UpwForm
      :class="styles.clientForm.content"
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
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwForm, Button, Drawer } from "@upmind/upwind";

// --- utils
import { isEmpty, omit, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClientForm",
  directives: { autoAnimate: vAutoAnimate },
  components: { UpwForm, Drawer, Button },
  props: {
    modelValue: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    open: { type: Boolean },
    modal: { type: Boolean, default: true },
    autosave: { type: Boolean, default: false },
    color: { type: String, default: "base" },
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
          variant: "ghost",
          color: this.color,
          disabled: this?.meta?.isProcessing,
          handler: () => this.cancel(),
        },

        submit: {
          type: "submit",
          variant: "flat",
          color: this.color,
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
    isOpen() {
      return this.open;
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
    onClose(value) {
      this.$emit("update:open", value);
      if (!value) this.cancel();
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
        item.handler({ model: this.model, meta: this.meta });
      }
    },
  },
});
</script>
