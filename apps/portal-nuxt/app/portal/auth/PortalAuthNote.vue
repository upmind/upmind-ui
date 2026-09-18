<template>
  <Markdown
    v-if="meta.isNoted"
    tag="div"
    :model-value="meta.note"
    :class="LOGGED_OUT_NOTE_CLASS"
    data-test-key="logged-out-note"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/auth/PortalAuthNote
 * @description The brand's own note for the sign-in and sign-up screens. It is
 * body content, not chrome, so each template places it where the cart places
 * the organism's `markdown` slot — and the templates the cart gives no markdown
 * to place none either.
 */
import { Markdown } from "@upmind/ui";
import { computed } from "vue";
import { compact } from "lodash-es";
import { useMockBrandGates } from "~/portal/mock/gates";
import { LOGGED_OUT_NOTE_CLASS } from "~/portal/shell/variants";
import { RESERVED_PILLAR_SEGMENT } from "~/portal/types";

const route = useRoute();
const { loginMarkdown, registerMarkdown } = useMockBrandGates();

/** Legacy authored one note for each of the two screens. */
function screenNote(segment: string | undefined): string {
  if (segment === RESERVED_PILLAR_SEGMENT.LOGIN) return loginMarkdown.value;
  if (segment === RESERVED_PILLAR_SEGMENT.REGISTER) {
    return registerMarkdown.value;
  }
  return "";
}

const meta = computed(() => {
  const [segment] = compact(route.path.split("/"));
  const note = screenNote(segment);
  return { note, isNoted: note !== "" };
});
</script>
