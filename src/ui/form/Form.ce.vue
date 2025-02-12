<template>
  <component
    :is="as"
    :class="styles.form.root"
    :disabled="meta.isProcessing"
    @submit.prevent="doSubmit"
  >
    <JsonForms
      ref="form"
      :additionalErrors="additionalErrors"
      :ajv="ajv"
      :class="styles.form.content"
      :data="model"
      :enabled="!meta.isDisabled"
      :i18n="i18n"
      :readonly="readonly"
      :renderers="renderers"
      :schema="schema"
      :uischema="uischema"
      :validationMode="mode"
      @change="onChange"
    />

    <slot name="footer" v-bind="{ meta }">
      <!-- debugging -->
      <!-- <pre>{{ { model, meta, errors } }}</pre> -->
    </slot>

    <!-- actions -->
    <div v-if="actions && !noActions" :class="styles.form.actions">
      <slot name="actions" v-bind="{ meta, doReject, doResolve: doSubmit }">
        <Button
          v-for="(action, key) in actions"
          :key="key"
          :color="color"
          v-bind="action"
          @click="doAction(action, $event)"
        />
      </slot>
    </div>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { ref, watch, computed, useTemplateRef, onMounted } from "vue";
import { useVModel } from "@vueuse/core";

// --- components
import { iterateSchema } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/vue";

// --- custom elements
import { Button } from "../button";

// --- local
import config from "./form.config";
import { upmindUIRenderers } from "./renderers";

// --- utils

import { useStyles, isDeepEmpty, useValidation } from "../../utils";
import {
  includes,
  isEmpty,
  isEqual,
  isFunction,
  isString,
  mapValues,
  merge,
  set,
  get,
} from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { JsonFormsChangeEvent } from "@jsonforms/vue";
import type {
  JsonFormsI18nState,
  ValidationMode,
  UISchemaElement,
} from "@jsonforms/core";
import type {
  FormProps,
  FormActionProps,
  FormActionsProps,
  FormFooterProps,
} from "./types";
import type { ErrorObject } from "ajv";
// ----------------------------------------------

const props = withDefaults(defineProps<FormProps>(), {
  as: "form",
  // ---
  modelValue: () => ({}),
  additionalRenderers: () => [],
  additionalErrors: () => [],
  // --- Provide a way to add custom styles for a specific instance of the component
  uiConfig: () => ({ form: [] }),
  class: "",
});

const emits = defineEmits<{
  reject: [];
  resolve: [Object];
  "update:modelValue": [Object];
  "update:uischema": [Object];
  valid: [boolean];
  click: [{ model: object; meta: object }];
  action: [{ name: string; model: object; meta: object }];
}>();

const slots = defineSlots<{
  footer(props: FormFooterProps): void;
  actions(props: FormActionsProps): void;
}>();

// --- state
const { ajv } = useValidation(props.ajv);

const form = useTemplateRef("form");

const baseModel = props.modelValue;
const model = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: {},
});
const uischema = useVModel(props, "uischema", emits, {
  passive: true,
});
const errors = ref<ErrorObject[]>([]);
const touched = ref(false);

// ---

const meta = computed(() => {
  return {
    canTranslate: !isEmpty(props.i18n),
    isLoading: props.loading,
    isProcessing: props.processing,
    isPristine: isDeepEmpty(model.value),
    isDirty: baseModel !== model.value,
    isTouched: touched.value || !isEmpty(props.additionalErrors),
    isValid: isEmpty(errors.value),
    isDisabled: props.disabled || props.processing,
  };
});

const styles = useStyles(
  ["form", "form.button"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  form: { root: string; content: string; actions: string; button: string };
}>;

const renderers = Object.freeze([
  ...upmindUIRenderers,
  ...props.additionalRenderers,
]);

// --- computed
const actions = computed<Record<string, FormActionProps>>(() => {
  const defaultActions = {
    submit: {
      type: "submit",
      label: "Save",
      disabled: meta.value.isProcessing,
      loading: meta.value.isProcessing,
      handler: () => doSubmit(),
    } as FormActionProps,
    reset: {
      label: "Cancel",
      variant: "ghost",
      disabled: meta.value.isProcessing,
      handler: () => doReject(),
    } as FormActionProps,
  };

  let actions = props.actions || defaultActions;

  return mapValues(actions, (action: FormActionProps) => {
    return {
      ...action,
      loading:
        action.needsValid && (meta.value.isProcessing || meta.value.isLoading),
      disabled:
        meta.value.isProcessing ||
        action?.disabled ||
        (action.needsValid && !meta.value.isValid),
    };
  }) as Record<string, FormActionProps>;
});

const mode = computed<ValidationMode>(() => {
  // only show errors if we have interacted with the form
  return meta.value.isTouched ? "ValidateAndShow" : "ValidateAndHide";
});

// --- methods
function onChange({ data, errors: newErrors }: JsonFormsChangeEvent) {
  errors.value = newErrors ?? [];
  data ??= {};
  model.value ??= {};
  // finally check if the data has actually changed and emit the update event
  // this json parse/stringify is a hack to do a deep compare and ignore functions/reactivity
  const rawData = JSON.parse(JSON.stringify(data));
  const rawModel = JSON.parse(JSON.stringify(model.value));

  if (!isEqual(rawData, rawModel)) {
    touched.value = true;
    model.value = data;
    emits("update:modelValue", model.value);
  }

  const isValid = isEmpty(errors.value);
  emits("valid", isValid);
  if (isValid && props.autosave) {
    doSubmit();
  }
}

function doAction(item: FormActionProps, $event: HTMLElementEventMap["click"]) {
  touched.value = true;

  if (meta.value.isProcessing) {
    $event.preventDefault();
    return;
  }

  if (!includes(["submit", "reset"], item?.type)) {
    // dont propagate the form if we are have an action that is not submit or reset
    $event.preventDefault();
  }

  if (isFunction(item.handler)) {
    item.handler({ model: model.value, meta: meta.value });
    return;
  }

  if (isString(item.handler)) {
    emits("action", {
      name: item.handler,
      model: model.value,
      meta: meta.value,
    });
    return;
  }

  // fallback for submit/reset
  if (item.type === "submit") {
    doSubmit();
    return;
  } else if (item.type === "reset") {
    doReject();
    return;
  }

  emits("click", { model: model.value, meta: meta.value });
}

function doSubmit() {
  if (
    // meta.value.isPristine ||
    // !meta.value.isDirty ||
    // !meta.value.isValid ||
    meta.value.isProcessing
  )
    return; // safety check

  forceTouched();
  emits("resolve", model.value);
}

function doReject() {
  model.value = {};
  emits("update:modelValue", model.value);
  emits("reject");
}

function updateUischema(uischema: FormProps["uischema"]) {
  if (!uischema) return;
  iterateSchema(uischema, (child: FormProps["uischema"]) => {
    if (!child) return; //safety check
    child.options ??= {}; //safety check

    // map the form size :- this is the only way to ensure that all children elements have the same size as the form
    // child.options.size ??= props.size; // only set if not already set

    // map additional i18n, json forms just does title & description
    if (child?.i18n && isFunction(props?.i18n?.translate)) {
      const value = props?.i18n?.translate(
        child.i18n,
        child?.options?.title,
        model.value
      );
      merge(child.options, value);
    }
  });
}

function forceTouched() {
  if (!uischema?.value) return;
  iterateSchema(uischema.value, (child: UISchemaElement) => {
    if (!child) return; //safety check
    child.options ??= {}; //safety check
    set(child.options, "touched", meta.value.isTouched);
  });
}

function syncUischema() {
  // sync the uischema to the forms current uschema so that we ALWAYS have a uischema,
  // this is important for us to be able to manipulate the form
  const currentUischema: UISchemaElement = get(
    form.value,
    "uischemaToUse"
  ) as UISchemaElement;

  if (!currentUischema) return;

  uischema.value ??= currentUischema;
}

onMounted(() => {
  syncUischema();
});
// --- effects
watch(
  () => props,
  ({ uischema, additionalErrors }) => {
    syncUischema();
    updateUischema(uischema);
    if (!isEmpty(additionalErrors)) {
      forceTouched();
    }
  },
  { deep: true }
);
</script>
