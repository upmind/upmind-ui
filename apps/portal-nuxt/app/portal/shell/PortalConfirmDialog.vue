<template>
  <AlertDialog
    :open="meta.open"
    :title="meta.title"
    :description="meta.description"
    :action-label="meta.actionLabel"
    :cancel-label="props.cancelLabel"
    :destructive="meta.destructive"
    @action="accept"
    @cancel="cancel"
    @update:open="onOpenChange"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalConfirmDialog
 * @description The shell's ONE confirmation dialog (plan R4). Every
 * destructive verb in the mock layer answers with a `confirm`, and this
 * renders it: accept re-dispatches the verb it carries, cancel does nothing.
 * Mounted once, beside the `Toaster`, so no module owns a dialog.
 */
import { AlertDialog } from "@upmind/ui";
import { computed } from "vue";
import type { PortalConfirmDialogProps } from "./types";
import { useConfirmDialog } from "~/composables/useConfirmDialog";

defineOptions({ name: "PortalConfirmDialog" });

const props = defineProps<PortalConfirmDialogProps>();

const { pending, accept, cancel, close } = useConfirmDialog();

const meta = computed(() => ({
  open: pending.value !== undefined,
  title: pending.value?.title,
  description: pending.value?.description,
  actionLabel: pending.value?.actionLabel,
  destructive: pending.value?.destructive
}));

function onOpenChange(open: boolean): void {
  if (open) return;
  close();
}
</script>
