<template>
  <Dialog
    v-model:open="open"
    :ui-config="{
      dialog: {
        scrollable: [styles.modal.scrollable],
        container: [styles.modal.container],
        header: [styles.modal.header],
        footer: [styles.modal.footer]
      } as any
    }"
  >
    <header :class="styles.modal.header">
      <h2 v-if="title" :class="styles.modal.title">{{ title }}</h2>
      <p v-if="description" :class="styles.modal.description">
        {{ description }}
      </p>
    </header>

    <Form
      :key="locale"
      v-bind="forwarded"
      v-model="modelValue"
      @resolve="doResolve"
      @reject="doReject"
    >
      <template #footer="{ meta }">
        <slot name="footer" v-bind="{ meta }"></slot>
      </template>
      <template #actions="{ meta, doResolve, doReject }">
        <slot name="actions" v-bind="{ meta, doResolve, doReject }"></slot>
      </template>
    </Form>

    <template #footer>
      <Button
        :label="label || t('action.confirm')"
        :disabled="!isValid"
        data-test-key="button-confirm-amount"
        size="lg"
        block
        @click="doResolve"
      />
      <Link
        :label="cancelLabel || t('action.cancel')"
        :disabled="!isValid"
        color="muted"
        size="lg"
        block
        class="mx-auto"
        @click="doReject"
      />
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  useForwardPropsEmits,
  Dialog,
  Button,
  Link
} from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./form.config";
import Form from "./Form.vue";
import type { FormModalProps } from "./types";
import type {
  FormFooterProps,
  FormActionsProps
} from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
const props = defineProps<FormModalProps>();

const emits = defineEmits<{
  reject: [];
  resolve: [Record<string, any>];
  "update:modelValue": [any];
  "update:uischema": [any];
  "update:open": [boolean];
  valid: [boolean];
  click: [{ model: Record<string, any>; meta: Record<string, any> }];
  action: [
    { name: string; model: Record<string, any>; meta: Record<string, any> }
  ];
}>();

const forwarded = useForwardPropsEmits(props, emits);

const open = defineModel<boolean>("open", {});

const modelValue = defineModel<Record<string, any>>("modelValue", {});

const isValid = ref(true);

const { t, locale } = useI18n();

const _slots = defineSlots<{
  footer: FormFooterProps;
  actions: FormActionsProps;
}>();

const styles = useStyles("modal", props, config, props.uiConfig ?? {});

function doResolve() {
  emits("resolve", modelValue.value ?? {});
  open.value = false;
}

function doReject() {
  emits("reject");
  open.value = false;
}
</script>
