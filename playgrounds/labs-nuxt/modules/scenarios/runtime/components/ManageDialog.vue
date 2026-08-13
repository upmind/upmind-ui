<template>
  <Dialog
    :open="true"
    :title="title"
    size="3xl"
    no-footer
    :data-attrs="{ 'data-test-key': 'manage-dialog' }"
    @update:open="onOpen"
  >
    <!-- A settled save closes the editor; the collection behind it refetches on
         the module's OWN invalidation, never on a second refresh from here. -->
    <FormFlowSurface
      :snapshot="port.snapshot()"
      :actions="port.actions"
      :feedback="handoff.feedback"
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

import { computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Dialog } from "@upmind-automation/upmind-ui";
import { useModulePort } from "../composables/useModulePort";
import FormFlowSurface from "./surfaces/FormFlowSurface.vue";
import { get, isFunction, isNil, noop } from "lodash-es";
import type { ManageDialogProps } from "./ManageDialog.types";
// -----------------------------------------------------------------------------

const props = defineProps<ManageDialogProps>();

const emit = defineEmits<{
  /** The editor is done with — dismissed, cancelled or saved. */
  close: [];
}>();

const { t } = useI18n();

const isNew = computed(() => isNil(props.context));

// The shared vocabulary's own add-or-update pair, chosen the way `Manage.vue`
// chooses it — by whether a record is being edited at all.
const title = computed(() =>
  t("action.add_new_or_update", isNew.value ? 1 : 0)
);

const port = useModulePort(props.handoff.useMutate, {
  actor: props.handoff.actor,
  context: props.context,
  fresh: isNew.value
});

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
