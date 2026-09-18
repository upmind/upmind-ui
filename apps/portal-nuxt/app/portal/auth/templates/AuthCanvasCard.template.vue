<template>
  <PortalAuthShell>
    <Page width="wide">
      <PageBody>
        <Card size="lg" :ui="{ content: CANVAS_CARD_BODY_CLASS }">
          <section :class="CANVAS_CARD_HEADER_CLASS">
            <slot name="hero" />
            <PortalAuthNote />
            <slot name="markdown" />
          </section>

          <section>
            <slot name="form" />
          </section>
        </Card>
      </PageBody>
    </Page>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// One wide card with a two-column interior — what develop's
// `SessionCanvasCard.template.vue` draws on the cart's CANVAS_CARD layout in
// centred mode: the hero and the marketing copy beside the form at `lg`,
// stacked below it.
import { Card, Page, PageBody } from "@upmind/ui";
import PortalAuthNote from "../PortalAuthNote.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import {
  CANVAS_CARD_BODY_CLASS,
  CANVAS_CARD_HEADER_CLASS
} from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
