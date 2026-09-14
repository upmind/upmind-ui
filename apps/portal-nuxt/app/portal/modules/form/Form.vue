<template>
  <div :class="FORM_MODULE_CLASS">
    <div v-if="meta.hasHeading" :class="FORM_HEADING_CLASS">
      <p v-if="props.title" :class="FORM_TITLE_CLASS">{{ props.title }}</p>
      <p v-if="props.description" :class="FORM_DESCRIPTION_CLASS">
        {{ props.description }}
      </p>
    </div>

    <Form
      v-model="draft"
      :schema="props.schema"
      :uischema="props.uischema"
      :ajv="ajv"
      :actions="meta.actions"
      :no-actions="props.readonly"
      :readonly="props.readonly"
      :autosave="props.autosave"
      v-bind="useTestAttrs({ key: 'portal-form', value: props.submit })"
      @resolve="onResolve"
      @reject="onReject"
    />
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/form/Form
 * @description The `form` module (plan F1) — the ONE wrapper around the
 * design system's JSON Forms engine. There is no second engine and no
 * per-form component: a form is this module fed a schema, a uischema, a model
 * and a submit verb, exactly as a list is fed rows.
 *
 * Submit emits `select` with `<submit>:<json>`, the verb grammar's free-text
 * tail (the composer's reply uses the same seam) carrying the JSON-encoded
 * model; where the form edits an entity the config hands `submit` in already
 * suffixed, so the value reads `<verb>:<id>:<json>`. Reset restores the model
 * the form opened with — the engine's own reject empties it.
 *
 * `readonly` withholds the ACTIONS as well as disabling the fields: a form
 * shown for reference has nothing to send, and a submit control that exists
 * but cannot be pressed still tells a reader the form is theirs to save.
 *
 * No `i18n` prop (plan F8): labels come from the schemas' titles and the
 * uischemas' labels, and `useFormTranslate` falls back to the key.
 */
import { Form, useTestAttrs } from "@upmind/ui";
import { computed, ref, watch } from "vue";
import { usePortalAjv } from "../../mock/forms/ajv";
import {
  FORM_DESCRIPTION_CLASS,
  FORM_HEADING_CLASS,
  FORM_MODULE_CLASS,
  FORM_TITLE_CLASS
} from "./variants";
import { assign, cloneDeep, fromPairs, map } from "lodash-es";
import type { FormModuleEmits, FormModuleProps } from "./types";
import type { FormActionProps, FormModel } from "@upmind/ui";

defineOptions({ name: "PortalForm" });

const props = defineProps<FormModuleProps>();
const emits = defineEmits<FormModuleEmits>();

const ajv = usePortalAjv();

/**
 * The edit copy. Cloned, because the engine writes into what it is handed and
 * the prop is the dataset's own selector output; re-seeded whenever the
 * dataset answers differently, so a successful save re-renders from the store
 * rather than from what was typed (plan F6).
 */
const draft = ref<FormModel>(cloneDeep(props.model));

watch(
  () => props.model,
  model => {
    draft.value = cloneDeep(model);
  }
);

const meta = computed(() => ({
  hasHeading: props.title !== undefined || props.description !== undefined,
  actions: assign(dismissAction(), extraActions(), {
    submit: {
      type: "submit" as const,
      label: props.submitLabel,
      needsValid: true
    }
  })
}));

/**
 * The control that takes the client back out of the form. In a dialog that
 * means CLOSING it, so the host is asked; on a page it means restoring what
 * the form opened with, which the engine's own reset does.
 */
function dismissAction(): Record<string, FormActionProps> {
  if (props.cancelLabel === undefined) {
    return {
      reset: {
        type: "reset",
        label: props.resetLabel,
        variant: "ghost"
      }
    };
  }
  return {
    cancel: {
      type: "button",
      label: props.cancelLabel,
      variant: "ghost",
      handler: () => emits("cancel")
    }
  };
}

/**
 * The config's own controls, as the engine's action map. They act on the
 * entity rather than on the draft, so each emits its verb bare — the same
 * door every other control in the app goes out of.
 */
function extraActions(): Record<string, FormActionProps> {
  return fromPairs(
    map(props.extraActions ?? [], action => [
      action.value,
      {
        type: "button" as const,
        label: action.label,
        variant: "outline" as const,
        handler: () => emits("select", action.value)
      }
    ])
  );
}

function onResolve(model: Record<string, unknown>): void {
  emits("select", `${props.submit}:${JSON.stringify(model)}`);
}

/** The engine's reject empties its own copy; the module puts the opening one back. */
function onReject(): void {
  draft.value = cloneDeep(props.model);
}
</script>
