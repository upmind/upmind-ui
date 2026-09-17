<template>
  <AuthShell
    :variant="props.variant"
    :reverse="props.reverse"
    skip-label="Skip to content"
  >
    <template #header>
      <PortalBrand :label="brandName" to="/login" />
      <Button
        v-if="store"
        variant="outline"
        size="sm"
        :as="store.as"
        :to="store.to"
        :href="store.href"
        data-test-key="logged-out-store"
      >
        <ShoppingBasket />
        Place new order
      </Button>
    </template>

    <div :class="LOGGED_OUT_COLUMN_CLASS">
      <Markdown
        v-if="meta.isNoted"
        tag="div"
        :model-value="meta.note"
        :class="LOGGED_OUT_NOTE_CLASS"
        data-test-key="logged-out-note"
      />
      <Card v-if="props.card" :ui="{ content: LOGGED_OUT_CARD_CONTENT_CLASS }">
        <slot />
      </Card>
      <slot v-else />
    </div>

    <template v-if="slots.brand" #brand>
      <slot name="brand" />
    </template>

    <template v-if="slots.secondary" #secondary>
      <slot name="secondary" />
    </template>

    <template #footer>
      <Markdown
        v-if="footerMarkdown"
        tag="div"
        :model-value="footerMarkdown"
        :class="PORTAL_FOOTER_PROSE_CLASS"
      />
      <a
        v-if="hasUpmindBranding"
        :class="PORTAL_FOOTER_LINK_CLASS"
        href="https://upmind.com"
        target="_blank"
        rel="noreferrer"
        >Powered by Upmind</a
      >
    </template>
  </AuthShell>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/auth/PortalAuthShell
 * @description The chrome every auth page of this app draws: the wordmark row,
 * the brand's note for the screen, and the quiet footer. The seven templates
 * beside it differ only in the arrangement they pass here, so the chrome is
 * written once and the page still belongs to the app (Amendment 1 change 3).
 */
import {
  AuthShell,
  Button,
  Card,
  Markdown,
  type AuthShellProps
} from "@upmind/ui";
import { ShoppingBasket } from "lucide-vue-next";
import { computed, useSlots } from "vue";
import { compact } from "lodash-es";
import { NuxtLink } from "#components";
import { useMockBrandGates } from "~/portal/mock/gates";
import PortalBrand from "~/portal/modules/brand/Brand.vue";
import {
  LOGGED_OUT_CARD_CONTENT_CLASS,
  LOGGED_OUT_COLUMN_CLASS,
  LOGGED_OUT_NOTE_CLASS,
  PORTAL_FOOTER_LINK_CLASS,
  PORTAL_FOOTER_PROSE_CLASS
} from "~/portal/shell/variants";
import { RESERVED_PILLAR_SEGMENT } from "~/portal/types";

const props = withDefaults(
  defineProps<{
    variant: AuthShellProps["variant"];
    reverse?: boolean;
    /** Canvas-toned arrangements set the form on a card; surface-toned ones do not. */
    card?: boolean;
  }>(),
  { reverse: false, card: false }
);

const route = useRoute();
const slots = useSlots();

const {
  brandName,
  footerMarkdown,
  hasUpmindBranding,
  loginMarkdown,
  registerMarkdown,
  storeShortcut
} = useMockBrandGates();

/** The brand's own note for this screen — legacy authored one for each of the two. */
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

/** The header's cart shortcut, as the primitive's polymorphic `as` needs it. */
const store = computed(() => {
  const shortcut = storeShortcut.value;
  if (shortcut === undefined) return undefined;
  if ("href" in shortcut) {
    return { as: "a", href: shortcut.href, to: undefined };
  }
  return { as: NuxtLink, href: undefined, to: shortcut.to };
});
</script>
