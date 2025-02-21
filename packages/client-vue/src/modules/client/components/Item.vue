<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Drawer : 'section'"
    :title="safeTitle"
    :open="isOpen"
    :skrim="skrim"
    :class="styles.clientForm.root"
    :class-footer="styles.clientForm.footer"
    fit="cover"
    @reject="onClose"
    @update:open="onClose"
    size="2xl"
    :nested="nested"
  >
    <SkeletonList :class="styles.clientForm.loading" v-if="meta.isLoading" />

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
        @click="doAction(action)"
      />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { inject, computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, type FormActionProps } from "@upmind-automation/upmind-ui";
import config from "../client.config";

// --- components
import { Button, Drawer, SkeletonList } from "@upmind-automation/upmind-ui";

import Form from "../../../components/form/Form.vue";

// --- utils
import { isEmpty, omit, isFunction } from "lodash-es";

// ---types
import type { ComputedRef } from "vue";
import type { ClientItemProps } from "../types";

// -----------------------------------------------------------------------------

const emit = defineEmits<{
  (e: "update:open", payload: boolean): void;
}>();

const props = withDefaults(defineProps<ClientItemProps>(), {
  open: false,
  modal: true,
  nested: false,
  autosave: false,
  skrim: "dark",
  color: "base",
});

const { t } = useI18n();
const useClient = inject("client") as any;
const { meta, model, schema, uischema, input, update, cancel } = useClient(
  props.modelValue
);
const styles = useStyles(["clientForm"], meta, config) as ComputedRef<{
  clientForm: {
    root: string;
    content: string;
    footer: string;
    loading: string;
  };
}>;

const actions = computed((): Record<string, FormActionProps> => {
  const actions: Record<string, FormActionProps> = {
    cancel: {
      label: t(`client.${props.i18nKey}.actions.cancel`),
      variant: "link",
      color: props.color,
      disabled: meta.value.isProcessing,
      handler: () => cancel(),
    },
    submit: {
      type: "submit",
      variant: "flat",
      color: props.color,
      label: t(
        `client.${props.i18nKey}.actions.submit`,
        model?.companyDetails ? 0 : 1
      ),
      disabled: !meta.value.isValid || meta.value.isProcessing,
      handler: ({ model }: any) => update(model),
    },
  };

  return props.modal ? actions : omit(actions, "cancel");
});

const hideActions = computed(() => {
  // always hide actions in modal,
  // always show the actions if we are not autosaving
  // otherwise, if we have autosave,
  //            and the user chooses to manually enter the address,
  //            or the place is missing info (e.g. no street address)
  // then show the actions
  if (props.modal) return true;
  if (!props.autosave) return false;
  return !model.value?.manualPlace;
});

const isOpen = computed(() => {
  return props.open;
});

const safeTitle = computed(() => {
  if (model.value?.companyDetails) {
    return t(
      `client.${props.i18nKey}.form.title.company`,
      meta.value.isNew ? 1 : 0
    );
  }

  return t(
    `client.${props.i18nKey}.form.title.address`,
    meta.value.isNew ? 1 : 0
  );
});

function onClose(value?: boolean) {
  emit("update:open", !!value);
  if (!value) cancel();
}

function onUpdate(model: any) {
  emit("update:open", false);
  update(model);
}

function maybeSubmit(isValid: boolean) {
  if (
    props.autosave &&
    isValid &&
    !isEmpty(model.value) &&
    !model.value.manualPlace
  ) {
    nextTick(() => {
      update(model.value);
    });
  }
}

function doAction(item: FormActionProps) {
  if (isFunction(item?.handler)) {
    item.handler({ model: model.value, meta: meta.value });
  }
}
</script>
