<template>
  <DialogRoot v-model:open="open">
    <DialogContent
      :close-label="t('action.close')"
      class="gap-6 overflow-y-auto p-8 text-center md:p-18"
    >
      <DialogHeader
        v-if="title || description"
        class="flex flex-col gap-2 text-center"
      >
        <DialogTitle v-if="title" class="text-3xl md:text-4xl">
          {{ title }}
        </DialogTitle>
        <DialogDescription v-if="description" class="text-base">
          {{ description }}
        </DialogDescription>
      </DialogHeader>

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

      <DialogFooter class="flex-col gap-3 sm:flex-col">
        <Button
          :disabled="!isValid"
          :data-attrs="{ 'data-test-key': 'button-confirm-amount' }"
          size="lg"
          block
          @click="doResolve"
        >
          {{ label || t("action.confirm") }}
        </Button>
        <Link
          :disabled="!isValid"
          color="muted"
          size="md"
          class="mx-auto"
          @click="doReject"
        >
          {{ cancelLabel || t("action.cancel") }}
        </Link>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>

<script lang="ts" setup>
import { useForwardPropsEmits } from "@upmind/ui";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle
} from "@upmind/ui";
import { Link, Button } from "@upmind/ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Form } from "@upmind-automation/foundation";
import type { FormModalProps } from "../types";
import type { FormFooterProps, FormActionsProps } from "@upmind/ui";

const open = defineModel<boolean>("open", {});

const modelValue = defineModel<Record<string, any>>("modelValue", {});

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

const _slots = defineSlots<{
  footer: FormFooterProps;
  actions: FormActionsProps;
}>();

const forwarded = useForwardPropsEmits(props, emits);

const isValid = ref(true);

const { t, locale } = useI18n();

function doResolve() {
  emits("resolve", modelValue.value ?? {});
  open.value = false;
}

function doReject() {
  emits("reject");
  open.value = false;
}
</script>
