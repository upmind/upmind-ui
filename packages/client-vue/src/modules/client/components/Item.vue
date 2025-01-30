<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? 'Drawer' : 'section'"
    :title="safeTitle"
    :open="isOpen"
    :actions="actions"
    :skrim="skrim"
    :class="styles.clientForm.root"
    :class-footer="styles.clientForm.footer"
    fit="cover"
    v-auto-animate
    @reject="onClose"
    @update:open="onClose"
    size="2xl"
    :nested="nested"
  >
    <SkeletonList
      :class="styles.clientListings.loading"
      v-if="meta.isLoading"
    />

    <Form
      v-else
      :class="styles.clientForm.content"
      :processing="meta.isProcessing"
      :loading="meta.isLoading"
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
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import { Button, Drawer, SkeletonList } from "@upmind-automation/upmind-ui";

import Form from "../form/Form.vue";

// --- utils
import { isEmpty, omit, isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "ClientForm",
  directives: { autoAnimate: vAutoAnimate },
  components: { Form, Drawer, Button, SkeletonList },
  props: {
    modelValue: {
      type: Object, // xstate actor
      required: true,
    },
    i18nKey: { type: String, required: true },
    open: { type: Boolean },
    modal: { type: Boolean, default: true },
    nested: { type: Boolean, default: false },
    autosave: { type: Boolean, default: false },
    skrim: { type: String, default: "dark" },
    color: { type: String, default: "base" },
  },
  setup(props) {
    const { t } = useI18n();
    const useClient = inject("client");
    const { state, meta, model, schema, uischema, input, update, cancel } =
      useClient(props.modelValue);
    const styles = useStyles(["clientForm"], meta, config);

    return {
      t,
      styles,
      state,
      meta,
      model,
      schema,
      uischema,
      input,
      update,
      cancel,
    };
  },

  computed: {
    actions() {
      const actions = {
        cancel: {
          label: this?.t(`client.${this.i18nKey}.actions.cancel`),
          variant: "link",
          color: this.color,
          disabled: this?.meta?.isProcessing,
          handler: () => this.cancel(),
        },

        submit: {
          type: "submit",
          variant: "flat",
          color: this.color,
          label: this?.t(
            `client.${this.i18nKey}.actions.submit`,
            this.model?.companyDetails ? 0 : 1
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
      if (this.model?.companyDetails) {
        return this.t(
          `client.${this.i18nKey}.form.title.company`,
          this?.meta?.isNew ? 1 : 0
        );
      }

      return this.t(
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
