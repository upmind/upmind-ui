<template>
  <TooltipProvider>
    <AuthShell variant="centered" skip-label="Skip to content">
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
        <Card :ui="{ content: LOGGED_OUT_CARD_CONTENT_CLASS }">
          <slot />
        </Card>
      </div>

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
    <Toaster />
  </TooltipProvider>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module layouts/logged-out
 * @description The shell the auth screens render in (plan F11) — the library's
 * own `AuthShell` on its `centered` variant, which is the arrangement legacy's
 * `skeleton/client/loggedOut` drew: a wordmark row, one narrow column under
 * it, and a quiet footer. The preset brings the skip link and the `<main>`
 * landmark with it, so this layout declares no chrome of its own.
 *
 * None of the signed-in chrome reaches here: no sidebar, no topbar menus, no
 * impersonation ribbon. What it DOES carry is everything a form needs — the
 * engine's two host seams (plan F7), the active dataset for the data-ref seam,
 * and the toaster every receipt lands in.
 */
import {
  AuthShell,
  Button,
  Card,
  Markdown,
  Toaster,
  TooltipProvider,
  provideFormEngineData,
  provideFormIcon
} from "@upmind/ui";
import { ShoppingBasket } from "lucide-vue-next";
import { computed, watch } from "vue";
import { compact } from "lodash-es";
import { NuxtLink } from "#components";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";
import { portalFormEngineData } from "~/portal/mock/forms/engine-data";
import { useMockBrandGates } from "~/portal/mock/gates";
import { provideActiveMockData } from "~/portal/mock/injection";
import PortalBrand from "~/portal/modules/brand/Brand.vue";
import PortalFormIcon from "~/portal/shell/PortalFormIcon.vue";
import {
  LOGGED_OUT_CARD_CONTENT_CLASS,
  LOGGED_OUT_COLUMN_CLASS,
  LOGGED_OUT_NOTE_CLASS,
  PORTAL_FOOTER_LINK_CLASS,
  PORTAL_FOOTER_PROSE_CLASS
} from "~/portal/shell/variants";
import { RESERVED_PILLAR_SEGMENT } from "~/portal/types";

const route = useRoute();

const { activeConfig } = usePortalConfig();
const { setTheme } = useTheme();

// The pages under this layout resolve their own rows through data refs, so the
// dataset has to be above them exactly as it is above the signed-in shell.
provideActiveMockData();

// The form engine's two host seams (plan F7) — a logged-out form needs them as
// much as a signed-in one does.
provideFormIcon(PortalFormIcon);
provideFormEngineData(portalFormEngineData());

const {
  brandName,
  footerMarkdown,
  hasUpmindBranding,
  loginMarkdown,
  registerMarkdown,
  storeShortcut
} = useMockBrandGates();

// The shape's own brand, applied the same way the signed-in layout applies it.
watch(activeConfig, config => setTheme(config.theme ?? "upmind"), {
  immediate: true
});

/** The brand's own note for this screen — legacy authored one for each of the two. */
function screenNote(segment: string | undefined): string {
  if (segment === RESERVED_PILLAR_SEGMENT.LOGIN) return loginMarkdown.value;
  if (segment === RESERVED_PILLAR_SEGMENT.REGISTER) {
    return registerMarkdown.value;
  }
  return "";
}

// No language row: i18n is out of scope this phase (plan F8), and a switcher
// that switches nothing is chrome pretending to work.
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
