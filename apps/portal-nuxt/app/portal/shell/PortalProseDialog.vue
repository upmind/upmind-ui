<template>
  <Dialog
    :open="meta.open"
    :title="meta.title"
    :close-label="props.closeLabel"
    @update:open="onOpenChange"
  >
    <Markdown
      tag="div"
      :model-value="meta.markdown"
      :class="PROSE_BODY_CLASS"
      v-bind="useTestAttrs({ key: 'portal-prose-dialog' })"
    />
  </Dialog>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/shell/PortalProseDialog
 * @description The shell's ONE read-only dialog (plan F6 N1), beside the form
 * and the confirmation. A row action answers with `MockActionResult.prose` —
 * a payment's instructions, and whatever else the brand writes for the client
 * to read — and this renders it as markdown. It asks nothing back, so it has
 * no submit and no verb: closing is the only way out.
 */
import { Dialog, Markdown, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { PROSE_BODY_CLASS } from "../modules/prose/variants";
import type { PortalProseDialogProps } from "./types";
import { useProseDialog } from "~/composables/useProseDialog";

defineOptions({ name: "PortalProseDialog" });

const props = defineProps<PortalProseDialogProps>();

const { pending, close } = useProseDialog();

const meta = computed(() => ({
  open: pending.value !== undefined,
  title: pending.value?.title,
  markdown: pending.value?.markdown ?? ""
}));

function onOpenChange(open: boolean): void {
  if (open) return;
  close();
}
</script>
