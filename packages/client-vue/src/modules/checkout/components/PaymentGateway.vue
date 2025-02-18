<template>
  <div
    ref="form"
    class="flex flex-col gap-6"
    :class="{
      'mb-4': (schema && uischema && !meta.isRenderless) || instructions,
    }"
  >
    <transition-group
      tag="div"
      :class="[
        'flex flex-col items-center justify-center gap-6',
        {
          '': variant === 'outline' || meta.hasRenderer || meta.hasInstructions,
          'border-control-error focus-within:ring-control-error focus-within:ring-4 focus-within:ring-opacity-20':
            meta.hasErrors &&
            (variant === 'outline' || meta.hasRenderer || meta.hasInstructions),
        },
      ]"
      enter-active-class="m-0 transition duration-300 ease-out"
      enter-from-class="-translate-y-10 transform opacity-0"
      enter-to-class="translate-y-0 transform opacity-100"
      leave-active-class="absolute transition duration-100 ease-in"
      leave-from-class="translate-y-0 transform opacity-100"
      leave-to-class="-translate-y-1 transform opacity-0"
      appear
    >
      <Spinner size="xs" v-if="meta.isLoading" key="spinner" />

      <!-- Instructions -->
      <Markdown
        v-if="instructions"
        class="m-0 w-full p-0"
        :model-value="instructions"
      />

      <!-- gateway Render Content (* IF Provided) -->
      <div
        ref="container"
        class="w-full empty:hidden"
        v-show="!meta.isLoading"
        key="render"
      ></div>

      <!-- gateway Form (* IF Provided) -->
      <Form
        key="form"
        v-if="schema && uischema && !meta.isRenderless"
        v-show="!meta.isLoading"
        class="w-full"
        :additional-errors="errors?.data"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="update"
        @update:modelValue="input"
        no-actions
      />

      <Alert
        v-if="!isEmpty(errors)"
        color="error"
        icon="alert-triangle"
        :title="t('payment.failed')"
      >
        <div class="mt-2 text-sm">
          <li
            v-for="error in errors"
            :key="error.message || error.title"
            class="my-0 py-0"
          >
            {{ error.message || error.title }}
          </li>
        </div>
      </Alert>
    </transition-group>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { onMounted, watch, ref } from "vue";
import { isEmpty } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless-vue";

// --- components
import { Spinner, Alert } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();

const {
  meta,
  errors,
  model,
  schema,
  uischema,
  renderer,
  clear,
  input,
  update,
  render,
  instructions,
} = useBasketPaymentGateway();

const { t } = useI18n();

const container = ref();
// wait till we mount then try to render the gateway if it's provided
// otherwise watch in case it's provided later
onMounted(() => {
  watch(renderer, () => {
    // only render if we have a renderer and we've not already rendered
    if (container.value?.innerHTML) return;

    render(container.value).catch(err => {
      if (err) console.error(err);
    });
  });
});
</script>
