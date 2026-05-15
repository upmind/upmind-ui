// -----------------------------------------------------------------------------
/**
 * @module domain/gtm
 * @description Google Tag Manager (`window.dataLayer`) events for the DAC
 * widget. Mirrors the contract documented in upmind-widgets' `Dac.md` so the
 * cart-nuxt embed pushes the same event shape as the standalone widget.
 *
 * All pushes are silent on failure — analytics errors must never affect the
 * widget. If `window.dataLayer` doesn't exist yet, it's created so events
 * buffer until GTM loads.
 */

// --- internal
import { useLocale } from "../system";

// --- utils
import { parseDomainParts, sanitiseDomainInput } from "./utils";

// --- types
import { DomainTypes } from "./types";

// -----------------------------------------------------------------------------

/**
 * Minimal context shape `buildCommonMeta` / `resolveWidgetMode` need.
 * Kept structurally narrow so both `DacContext` (child machine) and
 * `DomainContext` (parent machine) satisfy it.
 */
export type DacEventContext = {
  mode?: DomainTypes;
  useSuggestions?: boolean;
  search?: { query?: string };
};

// -----------------------------------------------------------------------------

/** Widget-facing search-mode label (matches the doc's `mode` field). */
export type DacWidgetMode = "suggest" | "search" | "transfer" | null;

/** Add-to-basket action variant. */
export type DacAddAction = "register" | "transfer";

// -----------------------------------------------------------------------------

/**
 * Resolves the widget-style mode from a headless context. The headless
 * `mode` is an operation flow (register/transfer/...) and `useSuggestions`
 * is a boolean; the doc surfaces them as a single `"suggest" | "search" |
 * "transfer" | null` value, so we map here.
 */
export function resolveWidgetMode(context: DacEventContext): DacWidgetMode {
  if (context.mode === DomainTypes.transfer) return "transfer";
  if (context.useSuggestions === true) return "suggest";
  if (context.useSuggestions === false) return "search";
  return null;
}

/**
 * Returns the active widget locale, swallowing any setup-context errors so
 * tracking can't break headless callers that fire outside Vue setup.
 */
function tryGetLocale(): string | undefined {
  try {
    return useLocale().locale.value;
  } catch {
    return undefined;
  }
}

/**
 * Common meta fields used on (almost) every DAC event. Caller spreads the
 * result into the event-specific fields.
 */
export function buildCommonMeta(
  context: DacEventContext
): Record<string, unknown> {
  const query = sanitiseDomainInput(context.search?.query ?? "");
  const { sld, tld } = parseDomainParts(query);
  return {
    locale: tryGetLocale(),
    query,
    sld,
    tld: tld ?? null,
    mode: resolveWidgetMode(context)
  };
}

/**
 * Push a DAC event onto `window.dataLayer`. The `event` arg should be the
 * raw event name (e.g. `"dac_search"`); the `upm.` prefix is added here.
 */
export function pushDacEvent(
  event: string,
  meta: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as Window & { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({
      event: `upm.${event}`,
      meta: {
        widget: "dac",
        route: window.location?.pathname ?? "",
        ...meta
      }
    });
  } catch {
    // silent — tracking errors must never break the widget
  }
}
