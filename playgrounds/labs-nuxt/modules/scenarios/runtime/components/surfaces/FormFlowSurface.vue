<template>
  <ModuleStateNotice v-if="notice" :state="notice" :detail="detail" />

  <!-- Loading draws the FORM's own frame — a label and a control per field it is
       standing in for, under the action bar's own placement — so nothing the
       user is waiting for moves when the real controls land (C8). -->
  <section
    v-else-if="isLoading"
    role="status"
    :aria-label="t('text.loading')"
    :class="styles.formFlowSurface.skeleton"
  >
    <div :class="styles.formFlowSurface.skeletonFields">
      <div
        v-for="field in SKELETON_FIELDS"
        :key="field"
        :class="styles.formFlowSurface.skeletonField"
      >
        <Skeleton :class="styles.formFlowSurface.skeletonLabel" />
        <Skeleton :class="styles.formFlowSurface.skeletonControl" />
      </div>
    </div>
    <!-- One placeholder per action the bar itself will draw — the same map the
         real `UpmForm` renders from, never a count guessed beside it. -->
    <div :class="styles.formFlowSurface.skeletonActions">
      <Skeleton
        v-for="key in keys(actions)"
        :key="key"
        :class="styles.formFlowSurface.skeletonAction"
      />
    </div>
  </section>

  <UpmForm
    v-else
    :schema="schema"
    :uischema="uischema"
    :model-value="model"
    :additional-errors="validationErrors"
    :additional-renderers="formRenderers"
    :actions="actions"
    :processing="isSubmitting"
    @update:model-value="onUpdate"
    @resolve="onResolve"
    @reject="emit('rejected')"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/FormFlowSurface
 * @description The Form-Flow archetype surface — `UpmForm` bound to
 * `snapshot.context.{schema,uischema,model}`, driven by the action names the
 * scenario DECLARES (`presentation.form`) and falling back to the archetype's
 * own `set`/`resolve` convention (the `useAuth` reference usage,
 * `pages/useAuth/[...scopeSuffix].vue`) — never invented here.
 *
 * The save goes out through the same feedback seam a row action does, so a
 * refused save is a sentence the user can read and act on. Like the list, the
 * notice is the BOOT experience only: a form that has presented itself stays on
 * screen after a refusal, because replacing it would take away the very fields
 * the next attempt is made from. And like the list, BOOT ITSELF is drawn in the
 * shape of what is coming (C8) — never a notice standing where a form will be.
 */

import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";
import { FormFlowActionTypes } from "../../scenario.types";
import { resolveModuleDetail, resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { useActionFeedback } from "../useActionFeedback";
import config from "./FormFlowSurface.styles";
import { isFunction, keys } from "lodash-es";
import type { FormFlowSurfaceProps } from "./FormFlowSurface.types";
import type { FormProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<FormFlowSurfaceProps>();

const emit = defineEmits<{
  /** The save settled successfully — what a host closes on. */
  resolved: [];
  /** The user abandoned the form. */
  rejected: [];
}>();

const { t } = useI18n();

const feedback = useActionFeedback();

/** The one control this surface fires — its save. */
const SUBMIT_CONTROL = "submit";

// How many field placeholders stand in for the form that has not landed yet.
// The schema arrives WITH the record (`data-manager.machine` assigns the pair
// on `loading` → `available`), so the count is the house form skeleton's own
// (`client-vue/components/manage/Skeleton.vue`) rather than a guess at a schema
// nobody can read yet.
const SKELETON_FIELDS = 2;

const state = computed(() => resolveModuleState(props.snapshot.meta));
const detail = computed(() => resolveModuleDetail(props.snapshot.context));

const hasPresented = ref(false);
watchEffect(() => {
  if (state.value === ModuleState.READY) hasPresented.value = true;
});

const isLoading = computed(
  () => !hasPresented.value && state.value === ModuleState.LOADING
);

const notice = computed(() =>
  hasPresented.value || state.value === ModuleState.READY || isLoading.value
    ? undefined
    : state.value
);

const schema = computed(
  () => props.snapshot.context.schema as FormProps["schema"]
);
const uischema = computed(
  () => props.snapshot.context.uischema as FormProps["uischema"]
);
const model = computed(
  () => props.snapshot.context.model as Record<string, unknown> | undefined
);
// The machine's own captured ajv errors, shown against the fields that raised
// them rather than as one sentence about the whole form.
const validationErrors = computed(
  () =>
    (props.snapshot.context.validationErrors ??
      []) as FormProps["additionalErrors"]
);

const inputAction = computed(
  () => props.form?.input ?? FormFlowActionTypes.INPUT
);
const submitAction = computed(
  () => props.form?.submit ?? FormFlowActionTypes.SUBMIT
);

const isSubmitting = computed(() => feedback.isPending(SUBMIT_CONTROL));

// The form's own action bar, in the shared vocabulary — `UpmForm`'s defaults are
// hardcoded English, and `doAction` falls through to submit/reset on type alone,
// so naming the labels costs no handler.
const actions = computed<FormProps["actions"]>(() => ({
  submit: {
    type: "submit",
    label: t("action.save_details"),
    color: "primary",
    loading: isSubmitting.value
  },
  reset: {
    type: "reset",
    label: t("action.cancel"),
    variant: "ghost",
    disabled: isSubmitting.value
  }
}));

const submitCopy = computed(() =>
  props.form?.feedback
    ? {
        success: t(props.form.feedback.success),
        failure: t(props.form.feedback.failure)
      }
    : undefined
);

function onUpdate(value: unknown): void {
  const input = props.actions[inputAction.value];
  if (isFunction(input)) input(value);
}

async function onResolve(): Promise<void> {
  const submit = props.actions[submitAction.value];
  if (!isFunction(submit)) return;

  const settled = await feedback.fire(
    SUBMIT_CONTROL,
    () => submit(model.value),
    submitCopy.value
  );

  if (settled) emit("resolved");
}

const meta = computed(() => ({
  state: state.value,
  isLoading: isLoading.value
}));
const styles = useStyles(["formFlowSurface"], meta, config);
</script>
