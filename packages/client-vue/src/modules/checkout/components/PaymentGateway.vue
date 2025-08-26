<template>
  <transition-group
    tag="div"
    :class="[
      'flex flex-col items-center justify-center gap-6',
      {
        '':
          variant === 'outline-solid' ||
          meta.hasRenderer ||
          meta.hasInstructions,
        'border-control-error focus-within:ring-control-error focus-within:ring-opacity-20 focus-within:ring-4':
          meta.hasErrors &&
          (variant === 'outline-solid' ||
            meta.hasRenderer ||
            meta.hasInstructions)
      }
    ]"
    enter-active-class="m-0 transition duration-300 ease-out"
    enter-from-class="-translate-y-10 transform opacity-0"
    enter-to-class="translate-y-0 transform opacity-100"
    leave-active-class="absolute transition duration-100 ease-in"
    leave-from-class="translate-y-0 transform opacity-100"
    leave-to-class="-translate-y-1 transform opacity-0"
    appear
  >
    <Spinner size="xs" v-if="!meta.isAvailable" key="spinner" />

    <!-- Instructions -->
    <Markdown
      v-if="instructions"
      class="m-0 w-full p-0"
      :model-value="instructions"
      key="instructions"
    />

    <!-- gateway Render Content (* IF Provided) -->
    <div ref="container" class="w-full" key="render"></div>

    <!-- gateway Form (* IF Provided) -->
    <Form
      key="form"
      v-if="schema && uischema && !meta.isRenderless"
      v-show="!meta.isLoading"
      class="w-full"
      :additional-errors="validationErrors"
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
      v-if="meta.hasErrors"
      color="error"
      icon="alert-triangle"
      :title="t('payment.failed')"
      key="alert"
    >
      <div class="mt-2 text-sm">
        <li class="my-0 py-0">
          {{ errors }}
        </li>
      </div>
    </Alert>
  </transition-group>
</template>

<script lang="ts" setup>
// --- external
import { onMounted, watch, useTemplateRef, type WatchHandle } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless";

// --- components
import { Spinner, Alert, Markdown } from "@upmind-automation/upmind-ui";
import Form from "../../../components/form/Form.vue";

// --- types
import type { PaymentGatewayProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<PaymentGatewayProps>();

const {
  meta,
  errors,
  validationErrors,
  model,
  schema,
  uischema,
  clear,
  input,
  update,
  render,
  instructions
} = useBasketPaymentGateway();

const { t } = useI18n();

const container = useTemplateRef("container");

// wait till we mount then try to render the gateway if it's provided
// otherwise watch in case it's provided later
onMounted(() => {
  if (meta.value.hasRenderer) {
    doRender();
  } else {
    const stop = watch(meta, () => {
      doRender(stop);
    });
  }
});

function doRender(stop?: WatchHandle) {
  console.log("doRender", {
    hasWatcher: !!stop,
    meta: meta.value
  });

  if (meta.value.isRenderless || !meta.value.isAvailable || !container.value)
    return;

  render(container.value)
    .then(() => {
      if (stop) stop(); // stop watching once rendered
    })
    .catch((err: any) => {
      debugger;
      if (stop) stop(); // stop watching once rendered
      console.error(err);
    });
}
</script>
