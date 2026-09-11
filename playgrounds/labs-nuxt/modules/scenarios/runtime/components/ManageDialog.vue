<template>
  <Dialog
    :open="true"
    :title="title"
    :close-label="t('action.close')"
    :data-attrs="{ 'data-test-key': 'manage-dialog' }"
    @update:open="onOpen"
  >
    <!-- A settled save closes the editor; the collection behind it refetches on
         the module's OWN invalidation, never on a second refresh from here. -->
    <FormFlowSurface
      :snapshot="port.snapshot()"
      :actions="port.actions"
      :feedback="handoff.feedback"
      :uischema="overrideUischema"
      @resolved="emit('close')"
      @rejected="emit('close')"
    />
  </Dialog>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ManageDialog
 * @description The editor a collection hands off to, opened OVER its list — the
 * add and edit halves of `Manage.vue`'s job, through the scenario architecture:
 * the handoff is declared INLINE (`R6-27`), the module's own `useMutate` boots
 * it, and the form the user fills in is that composable's own schemas.
 *
 * The record's id decides which half runs and the manager machine does the rest:
 * an id boots the editor `.for()` that record and its save UPDATES, no id boots
 * a `.fresh()` draft whose save CREATES. Nothing here knows either verb.
 *
 * It holds the instance for exactly as long as it is open: the scope registry
 * caches by key, so an editor left behind would be handed back to the next open
 * carrying the last one's record — which is why the target is destroyed on
 * unmount rather than merely stopped.
 */

import { Dialog } from "@upmind/ui";
import { computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useModulePort } from "../composables/useModulePort";
import FormFlowSurface from "./surfaces/FormFlowSurface.vue";
import { get, isEmpty, isFunction, isNil, isString, noop } from "lodash-es";
import type { ManageDialogProps } from "./ManageDialog.types";
import type { UISchemaElement } from "@jsonforms/core";
// -----------------------------------------------------------------------------

const props = defineProps<ManageDialogProps>();

const emit = defineEmits<{
  /** The editor is done with — dismissed, cancelled or saved. */
  close: [];
}>();

const { t } = useI18n();

const isNew = computed(() => isNil(props.context));

// The TITLE's question is not the boot's: a field-scoped open edits an
// EXISTING record even when no row context is named (the single-entity
// editor), so it titles as an update while the boot stays context-driven.
const titlesAsNew = computed(() => isNew.value && isNil(props.fieldScope));

const port = useModulePort(props.handoff.useMutate, {
  actor: props.handoff.actor,
  context: props.context,
  // A `?token=` editor is addressed by the token (`.withId`), not by a fresh
  // session — so it boots keyed by that identity rather than as a new instance.
  id: props.handoff.id,
  fresh: isNew.value && isNil(props.handoff.id),
  // The overlay builds its OWN port, so it must be told the same offered
  // actors the list was — otherwise the editor refuses an actor the
  // collection behind it just served.
  offeredActors: props.handoff.offeredActors
});

// Derive the override uischema from the cell's context when fieldScope is set.
// The cell's `useContext().uischemaFor()` pulls invalid fields into the view
// so a save can proceed when full-schema validation requires fields outside
// the narrowed view.
const overrideUischema = computed<UISchemaElement | undefined>(() => {
  if (isNil(props.fieldScope)) return undefined;

  const ctx = port.useContext?.();
  const uischemaFor = get(ctx, "uischemaFor") as
    | ((fields: string[]) => UISchemaElement | undefined)
    | undefined;

  if (!isFunction(uischemaFor)) return undefined;
  return uischemaFor([props.fieldScope]);
});

// A field-scoped open edits one topic group, but the generic form path draws
// no heading for it — so the title names it. The group's label is the first
// Group element on `overrideUischema` (the topic's server name, set by
// `useUischema`); absent it, the generic add-or-update title stands.
const scopeGroupLabel = computed<string | undefined>(() => {
  const group = get(overrideUischema.value, "elements[0]");
  if (get(group, "type") !== "Group") return undefined;
  const label = get(group, "label");
  return isString(label) && !isEmpty(label) ? label : undefined;
});

const title = computed(() =>
  isNil(scopeGroupLabel.value)
    ? t("action.add_new_or_update", titlesAsNew.value ? 1 : 0)
    : t("action.update_group", { group: scopeGroupLabel.value })
);

function onOpen(open: boolean): void {
  if (!open) emit("close");
}

onMounted(() => {
  const isReady = get(port.actions, "isReady");
  // Dismissing the editor mid-boot destroys the very actor this waits on, so
  // its rejection IS the close — never a failure the user caused, and never a
  // rejection left for the runtime to report.
  if (isFunction(isReady)) Promise.resolve(isReady()).catch(noop);
});

onUnmounted(() => {
  const destroy = get(port.actions, "destroy");
  if (isFunction(destroy)) destroy();
});
</script>
