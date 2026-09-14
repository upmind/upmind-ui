<template>
  <Dialog
    :open="meta.open"
    :title="meta.title"
    :close-label="props.closeLabel"
    @update:open="onOpenChange"
  >
    <PortalForm
      v-if="meta.entry"
      :schema="meta.entry.schema"
      :uischema="meta.entry.uischema"
      :description="meta.entry.description"
      :model="meta.entry.model"
      :submit="meta.entry.submit"
      :submit-label="meta.entry.submitLabel"
      :reset-label="meta.entry.resetLabel"
      :cancel-label="meta.entry.resetLabel"
      :extra-actions="meta.entry.extraActions"
      @cancel="close"
      @select="onSelect"
    />
  </Dialog>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalFormDialog
 * @description The shell's ONE form dialog (plan F2). A row action answers
 * with `MockActionResult.form`, and this mounts the `form` module bound to
 * that id's registry entry — schema, uischema, model and submit verb. Mounted
 * once, beside the confirmation dialog, so no module owns a dialog.
 *
 * The submit goes back out through the SAME door every other control uses:
 * the emitted verb is dispatched by the runner, which closes this dialog when
 * the receipt comes back good (composables/useMockActionRunner.ts). The
 * dialog decides nothing about the outcome.
 *
 * The registry's `resetLabel` rides in as the CANCEL label: in a dialog that
 * control has to dismiss, not empty the fields. It used to be the engine's
 * reset, so pressing "Cancel" cleared what had been typed and left the dialog
 * standing — only the X ever closed it.
 */
import { Dialog } from "@upmind/ui";
import { computed } from "vue";
import { resolveMockForm } from "../mock/forms/registry";
import { injectActiveMockData, injectRouteContext } from "../mock/injection";
import PortalForm from "../modules/form/Form.vue";
import type { PortalFormDialogProps } from "./types";
import { useFormDialog } from "~/composables/useFormDialog";
import { useMockActionRunner } from "~/composables/useMockActionRunner";

defineOptions({ name: "PortalFormDialog" });

const props = defineProps<PortalFormDialogProps>();

const activeData = injectActiveMockData();
const routeContext = injectRouteContext();
const { pending, close } = useFormDialog();

const { run: runMockAction } = useMockActionRunner(
  () => activeData.value,
  () => routeContext.value
);

const meta = computed(() => {
  const form = pending.value;
  const data = activeData.value;
  if (form === undefined || data === undefined) {
    return { open: false, title: undefined, entry: undefined };
  }
  const entry = resolveMockForm(data, form.id, form.entityId);
  if (entry === undefined) {
    return { open: false, title: undefined, entry: undefined };
  }
  return { open: true, title: entry.title, entry };
});

async function onSelect(value: string): Promise<void> {
  await runMockAction(value);
}

function onOpenChange(open: boolean): void {
  if (open) return;
  close();
}
</script>
