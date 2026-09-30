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
  Card,
  Markdown,
  Toaster,
  TooltipProvider,
  provideFormEngineData,
  provideFormIcon
} from "@upmind/ui";
import { watch } from "vue";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";
import PortalAuthStore from "~/portal/auth/PortalAuthStore.vue";
import { portalFormEngineData } from "~/portal/mock/forms/engine-data";
import { useMockBrandGates } from "~/portal/mock/gates";
import { provideActiveMockData } from "~/portal/mock/injection";
import PortalBrand from "~/portal/modules/brand/Brand.vue";
import PortalFormIcon from "~/portal/shell/PortalFormIcon.vue";
import PortalUpmind from "~/portal/shell/PortalUpmind.vue";
import {
  LOGGED_OUT_CARD_CONTENT_CLASS,
  LOGGED_OUT_COLUMN_CLASS,
  PORTAL_FOOTER_PROSE_CLASS
} from "~/portal/shell/variants";

const { activeConfig } = usePortalConfig();
const { setTheme } = useTheme();

// The pages under this layout resolve their own rows through data refs, so the
// dataset has to be above them exactly as it is above the signed-in shell.
provideActiveMockData();

// The form engine's two host seams (plan F7) — a logged-out form needs them as
// much as a signed-in one does.
provideFormIcon(PortalFormIcon);
provideFormEngineData(portalFormEngineData());

// No language row: i18n is out of scope this phase (plan F8), and a switcher
// that switches nothing is chrome pretending to work.
const { brandName, footerMarkdown, hasUpmindBranding } = useMockBrandGates();

// The shape's own brand, applied the same way the signed-in layout applies it.
watch(activeConfig, config => setTheme(config.theme ?? "upmind"), {
  immediate: true
});
</script>

<template>
  <TooltipProvider>
    <AuthShell variant="centered" skip-label="Skip to content">
      <template #header>
        <PortalBrand :label="brandName" to="/login" />
        <PortalAuthStore />
      </template>

      <div :class="LOGGED_OUT_COLUMN_CLASS">
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
        <PortalUpmind v-if="hasUpmindBranding" />
      </template>
    </AuthShell>
    <Toaster />
  </TooltipProvider>
</template>
