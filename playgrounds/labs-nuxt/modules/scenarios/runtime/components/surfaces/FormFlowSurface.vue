<template>
  <!-- Loading draws the FORM's own frame — a label and a control per field it is
       standing in for, under the action bar's own placement — so nothing the
       user is waiting for moves when the real controls land (C8). It is read
       FIRST, so a boot can never resolve to a notice standing where a form will
       be: a held read is the module still loading, whatever else its context is
       carrying from the pass before. -->
  <section
    v-if="isLoading"
    role="status"
    :aria-label="t('text.loading')"
    :class="formFlowSurface.skeleton()"
  >
    <div :class="formFlowSurface.skeletonFields()">
      <div
        v-for="field in skeletonFields"
        :key="field"
        :class="formFlowSurface.skeletonField()"
      >
        <Skeleton :class="formFlowSurface.skeletonLabel()" />
        <Skeleton :class="formFlowSurface.skeletonControl()" />
      </div>
    </div>
    <!-- One placeholder per action the bar itself will draw — the same map the
         real `UpmForm` renders from, never a count guessed beside it. -->
    <div :class="formFlowSurface.skeletonActions()">
      <Skeleton
        v-for="key in keys(actions)"
        :key="key"
        :class="formFlowSurface.skeletonAction()"
      />
    </div>
  </section>

  <ModuleStateNotice v-else-if="notice" :state="notice" :detail="detail" />

  <template v-else>
    <!-- A refused save is answered where the user is looking — beside the very
         fields the next attempt is made from, not only in the corner of the
         screen the toast lands in. -->
    <Alert
      v-if="saveFailure"
      variant="danger"
      appearance="muted"
      :title="saveFailure"
      :class="formFlowSurface.failure()"
    >
      <template #action>
        <Button
          size="sm"
          variant="ghost"
          icon-only
          :aria-label="t('action.dismiss')"
          :data-attrs="{ 'data-test-value': 'dismiss' }"
          @click="dismissFailure"
        >
          <Icon icon="x-close" size="nano" aria-hidden="true" />
          <span class="sr-only">{{ t("action.dismiss") }}</span>
        </Button>
      </template>
    </Alert>

    <!-- Locked is NOT disabled: the form keeps its live picture — a replay is
         showing the operator the form as the scenario drives it — and only the
         operator's hand is taken off it. `inert` takes every field and button
         out of the pointer's and the tab order's reach without restyling one
         of them; the region carries the reason as its title (`R6-23`). -->
    <div
      :inert="locked || undefined"
      :aria-disabled="locked || undefined"
      :title="locked ? t('labs.replay_locked') : undefined"
      data-test-key="form-region"
      :data-test-value="locked ? 'locked' : undefined"
    >
      <Form
        :schema="schema"
        :uischema="uischema"
        :model-value="model"
        :additional-errors="validationErrors"
        :additional-renderers="formRenderers"
        :actions="actions"
        :processing="isSubmitting"
        @update:model-value="onUpdate"
        @resolve="onResolve"
        @reject="onReject"
      />
    </div>
  </template>
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
 * refused save is a sentence the user can read and act on — including the one
 * an armed forced state hands down (`forcedRefusal`), which is drawn with
 * nothing pressed because a forced state IS the state. Like the list, the
 * notice is the BOOT experience only: a form that has presented itself stays on
 * screen after a refusal, because replacing it would take away the very fields
 * the next attempt is made from. And like the list, BOOT ITSELF is drawn in the
 * shape of what is coming (C8) — never a notice standing where a form will be.
 */

import { isControlElement, RuleEffect } from "@jsonforms/core";
import { Alert, Button, Skeleton } from "@upmind/ui";
import { computed, onUnmounted, ref, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { formRenderers } from "@upmind-automation/client-vue";
import { Form, Icon } from "@upmind-automation/foundation";
import { useScenarioStage } from "../../composables/useScenarioStage";
import {
  FORCE_RECIPE_KIND,
  FORCE_RECIPE_TARGET
} from "../../force/states.types";
import { resolveModuleDetail, resolveModuleState } from "../module-state";
import { ModuleState } from "../module-state.types";
import ModuleStateNotice from "../ModuleStateNotice.vue";
import { useActionFeedback } from "../useActionFeedback";
import { formFlowSurface } from "./FormFlowSurface.styles";
import { FormFlowActionTypes } from "./FormFlowSurface.types";
import { find, get, isFunction, isNil, keys, sumBy } from "lodash-es";
import type { FormFlowSurfaceProps } from "./FormFlowSurface.types";
import type { UISchemaElement } from "@jsonforms/core";
import type { FormProps } from "@upmind-automation/client-vue";
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

// What a form has at least one of, so the boot of a module that has not
// published its uischema yet is still form-shaped rather than empty.
const MIN_SKELETON_FIELDS = 1;

const state = computed(() =>
  resolveModuleState(props.snapshot.meta, props.snapshot.context)
);
const detail = computed(() => resolveModuleDetail(props.snapshot.context));

const hasPresented = ref(false);
watchEffect(() => {
  if (state.value === ModuleState.READY) hasPresented.value = true;
});

// Whatever the module says it is DOING wins over whatever its context is still
// holding: a module that has gone back to loading — a forced boot, a cache the
// arm has just cleared — is drawn as the form that is coming, never as a notice
// (C8). Gating this on "has not presented yet" left a re-read with no state of
// its own to draw, so the stale context beside it decided the picture.
const isLoading = computed(() => state.value === ModuleState.LOADING);

// The forced state armed on the page, read by recipe: a held save draws the
// form submitting with nothing pressed; a refused read draws the error state
// even over a form that has presented (`FormFlowSurfaceProps.forcedState`).
const forcedRecipe = computed(() => props.forcedState?.recipe);
const isForcedSaving = computed(
  () =>
    forcedRecipe.value?.kind === FORCE_RECIPE_KIND.PENDING &&
    forcedRecipe.value?.target === FORCE_RECIPE_TARGET.WRITE
);
const isForcedReadFailure = computed(
  () =>
    forcedRecipe.value?.kind === FORCE_RECIPE_KIND.REFUSED &&
    forcedRecipe.value?.target === FORCE_RECIPE_TARGET.READ
);

const notice = computed(() => {
  if (isForcedReadFailure.value && state.value === ModuleState.ERROR)
    return state.value;
  return hasPresented.value ||
    state.value === ModuleState.READY ||
    isLoading.value
    ? undefined
    : state.value;
});

const schema = computed(
  () => props.snapshot.context.schema as FormProps["schema"]
);

// The override prop wins when provided — the caller derives it from the cell's
// `useContext().uischemaFor()` so validation errors can pull additional fields
// into the view. Falls back to the snapshot's own uischema.
const uischema = computed(
  () =>
    props.uischema ??
    (props.snapshot.context.uischema as UISchemaElement | undefined)
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

/**
 * How many controls a uischema DRAWS — the placeholder count, so the skeleton
 * stands one field where the form will stand one field and the container it
 * opens in is already the size the form needs. A `HIDE` rule is a field the
 * user never sees (the auto-generated `id`), and a layout is counted through
 * rather than as a field of its own.
 */
function countControls(element: unknown): number {
  if (isNil(element)) return 0;
  if (isControlElement(element as UISchemaElement))
    return get(element, ["rule", "effect"]) === RuleEffect.HIDE ? 0 : 1;
  return sumBy(get(element, "elements", []), countControls);
}

const skeletonFields = computed(
  () => countControls(uischema.value) || MIN_SKELETON_FIELDS
);

// The module's OWN member names, taken from the live port rather than declared
// beside it (`R6-29`): a Form-Flow module drives through the flow machine's
// pair or the data manager's, and which one is a fact the port already carries.
const inputAction = computed(
  () =>
    find([FormFlowActionTypes.SET, FormFlowActionTypes.INPUT], name =>
      isFunction(props.actions[name])
    ) ?? FormFlowActionTypes.SET
);
const submitAction = computed(
  () =>
    find([FormFlowActionTypes.RESOLVE, FormFlowActionTypes.UPDATE], name =>
      isFunction(props.actions[name])
    ) ?? FormFlowActionTypes.RESOLVE
);

/**
 * @decision
 * what:     An OPTIONAL `revert` lookup, added to the shared runtime
 *           (`FormFlowSurface.vue`) — the one exception to operator ruling
 *           (c) (`docs/sdd/client-notifications-scf/review-notes.md`
 *           "Binding inputs recorded at this pass"). The conductor's ruling
 *           forbade shared-runtime changes generally; the operator lifted it
 *           for this one additive lookup only (`verify.md`'s ABSENT verdict,
 *           row 8 — the in-place-revert parity failure).
 * why:      `UpmForm`'s reset path has no reset-time hook beyond `@reject`
 *           (`Form.vue`'s `doReject`), which every sibling scenario relies on
 *           to destroy-and-close. A module that publishes a live `revert()`
 *           (`useClientNotificationsManager.actions.ts`) needs its OWN
 *           reset-time behaviour — restore the draft, keep the form open —
 *           and the surface has no other seam to read that capability from.
 *           Additive: absent, `revertAction` resolves `undefined` and
 *           `onReject` falls through to the exact `emit('rejected')` every
 *           sibling already runs, byte-identical.
 * rejected: A second prop threading the capability in from the scenario
 *           declaration — the write path already reads the live port's own
 *           member names this same way (`inputAction`/`submitAction`
 *           above); a `revert` lookup is the same seam, not a new one.
 */
const revertAction = computed(() =>
  find(["revert"], name => isFunction(props.actions[name]))
);

const isSubmitting = computed(
  () => feedback.isPending(SUBMIT_CONTROL) || isForcedSaving.value
);

// The forced refusal is a state of the PAGE, so it is dismissed like one —
// cleared until the state is armed again, rather than per fired control
// (`ListSurface.vue` draws its refused row the same way).
const isRefusalDismissed = ref(false);

watch(
  () => props.forcedRefusal,
  () => {
    isRefusalDismissed.value = false;
  }
);

// The API's own sentence where the refusal carried one — a save the user has
// not yet dismissed or re-attempted, or the recorded refusal an armed state has
// already drawn with nothing fired (operator ruling, 2026-08-28).
const saveFailure = computed(() => {
  const failure = feedback.failure(SUBMIT_CONTROL);

  if (isNil(failure))
    return isRefusalDismissed.value ? undefined : props.forcedRefusal;

  return failure || t("error.something_went_wrong");
});

// The form's own action bar, in the shared vocabulary — `UpmForm`'s defaults are
// hardcoded English, and `doAction` falls through to submit/reset on type alone,
// so naming the labels costs no handler.
const actions = computed<FormProps["actions"]>(() => ({
  // `needsValid` is the ui Form's own contract for a submit action: it spins
  // while the form processes (the consumer's `loading` alone is not read by
  // the action bar) and it cannot fire on an invalid form.
  submit: {
    type: "submit",
    label: t("action.save_details"),
    color: "primary",
    needsValid: true,
    loading: isSubmitting.value
  },
  reset: {
    type: "reset",
    // A module publishing `revert()` reads its OWN reset control as a revert,
    // not a cancel — the label the oracle's own in-place-revert button
    // carries. Absent, unchanged.
    label: revertAction.value
      ? t("action.notification_revert_changes")
      : t("action.cancel"),
    variant: "ghost",
    disabled: isSubmitting.value
  }
}));

const submitCopy = computed(() =>
  props.feedback
    ? {
        success: t(props.feedback.success),
        failure: t(props.feedback.failure)
      }
    : undefined
);

// Both halves of the same control: a fired save is dismissed through the
// feedback channel that raised it, a forced one through the page state that
// drew it with nothing fired.
function dismissFailure(): void {
  isRefusalDismissed.value = true;
  feedback.dismiss(SUBMIT_CONTROL);
}

function onUpdate(value: unknown): void {
  const input = props.actions[inputAction.value];
  if (isFunction(input)) input(value);
}

// Reset. Present, `revert()` restores the draft and the dialog STAYS OPEN —
// the oracle's in-place revert. Absent, today's destroy-and-close is
// unchanged: every sibling scenario is byte-identical.
function onReject(): void {
  const revert = revertAction.value && props.actions[revertAction.value];
  if (isFunction(revert)) {
    revert();
    return;
  }
  emit("rejected");
}

// --- The stage. An open editor is the thing a scenario types into, so its own
//     fill and submit are what a step drives — the very calls the fields and the
//     save button make, never a second way in.
const stage = useScenarioStage();

stage.registerEditor({
  fill: input => onUpdate({ ...(model.value ?? {}), ...input }),
  submit: () => onResolve()
});

onUnmounted(() => stage.clear("editor"));

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
</script>
