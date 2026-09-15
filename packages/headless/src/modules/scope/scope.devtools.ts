import { setupDevToolsPlugin } from "@vue/devtools-api";
import { ScopeActorTypes } from "./scope.types";
import { includes, isObject, keys, map, slice, split } from "lodash-es";
import type { RegistryEntry } from "./scope.registry";
import type { ScopeKey } from "./scope.types";
// -----------------------------------------------------------------------------
/**
 * @module scope/devtools
 * @description Vue DevTools integration for scope registry visualization.
 */
// --- constants
const INSPECTOR_ID = "upmind-scope-registry";
const PLUGIN_ID = "upmind.scope";
// The markers `generateScopeKey` stamps on every non-context segment. Written
// into the key as `<marker>:<value>`, so after `split(key, ":")` the marker and
// its value are two ADJACENT segments — never one segment with a prefix.
const BRAND_MARKER = "brand";
const FRESH_MARKER = "fresh";
const RECORD_MARKER = "id";
const MARKERS = [RECORD_MARKER, BRAND_MARKER, FRESH_MARKER];
// --- state
let devtoolsApi:
  | Parameters<Parameters<typeof setupDevToolsPlugin>[1]>[0]
  | null = null;
// -----------------------------------------------------------------------------
/**
 * Initializes Vue DevTools integration for the scope registry.
 * Creates a custom inspector that shows all active scoped composables.
 *
 * @param app - The Vue app instance
 * @param registry - The scope registry Map
 */
export function setupScopeDevtools(
  app: Parameters<typeof setupDevToolsPlugin>[0]["app"],
  registry: Map<ScopeKey, RegistryEntry>
): void {
  setupDevToolsPlugin(
    {
      id: PLUGIN_ID,
      label: "Upmind Scope Registry",
      packageName: "@upmind-automation/headless",
      homepage: "https://upmind.com",
      app
    },
    api => {
      devtoolsApi = api;

      // Register custom inspector
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Scope Registry",
        icon: "account_tree"
      });

      // Populate tree view (left panel)
      api.on.getInspectorTree(payload => {
        if (payload.inspectorId !== INSPECTOR_ID) return;

        const nodes = map(Array.from(registry.entries()), ([key]) => {
          const parts = key.split(":");
          const [name, actor] = parts;

          return {
            id: key,
            label: name,
            tags: [
              {
                label: actor,
                textColor: 0xffffff,
                backgroundColor: getActorColor(actor)
              }
            ]
          };
        });

        payload.rootNodes = nodes;
      });

      // Populate state view (right panel)
      api.on.getInspectorState(payload => {
        if (payload.inspectorId !== INSPECTOR_ID) return;

        const key = payload.nodeId;
        const entry = registry.get(key);

        if (!entry) return;

        const instance = entry.instance;

        // Marker-aware, never positional: a SELECTOR context contributes ONE
        // unmarked segment and a RETARGET two, so a fixed position would report
        // a `brand:` or `id:` value as the context id.
        //
        // `generateScopeKey` joins on ":" and writes each reserved segment as
        // `<marker>:<value>`, so splitting the whole key on ":" has ALREADY
        // separated every marker from its value. Matching a segment against a
        // colon-terminated prefix therefore never fires — no segment can still
        // contain a colon. The reserved segments are read as [marker, value]
        // PAIRS instead.
        //
        // Read from the RIGHT: `generateScopeKey` appends the reserved pairs
        // last, so a right-to-left walk stops where the context begins, and a
        // context type that happens to be spelled "brand" or "id" is never
        // mistaken for a marker.
        const [name, actor, ...rest] = split(key, ":");
        let recordId: string | undefined;
        let brandId: string | undefined;

        let contextEnd = rest.length;
        while (contextEnd >= 2 && includes(MARKERS, rest[contextEnd - 2])) {
          const marker = rest[contextEnd - 2];
          const value = rest[contextEnd - 1];
          if (marker === RECORD_MARKER) recordId = value;
          if (marker === BRAND_MARKER) brandId = value;
          contextEnd -= 2;
        }

        const [contextType, contextId] = slice(rest, 0, contextEnd);

        payload.state = {
          "Scope Config": [
            { key: "composable", value: name },
            { key: "actor", value: actor },
            ...(contextType
              ? [{ key: "contextType", value: contextType }]
              : []),
            ...(contextId ? [{ key: "contextId", value: contextId }] : []),
            ...(recordId ? [{ key: "recordId", value: recordId }] : []),
            ...(brandId ? [{ key: "brandId", value: brandId }] : [])
          ],
          Instance: [
            { key: "type", value: typeof instance },
            {
              key: "keys",
              value: isObject(instance) ? keys(instance) : []
            }
          ]
        };
      });
    }
  );
}

/**
 * Notifies DevTools to refresh the inspector.
 * Call after adding/removing entries.
 */
export function refreshDevtools(): void {
  if (devtoolsApi) {
    devtoolsApi.sendInspectorTree(INSPECTOR_ID);
    devtoolsApi.sendInspectorState(INSPECTOR_ID);
  }
}
// --- private
/**
 * Gets a color for the actor badge.
 */
function getActorColor(actor: string): number {
  switch (actor) {
    case ScopeActorTypes.STAFF:
      return 0x4f46e5; // Indigo
    case ScopeActorTypes.CLIENT:
      return 0x059669; // Green
    case ScopeActorTypes.GUEST:
      return 0x6b7280; // Gray
    default:
      return 0x3b82f6; // Blue
  }
}
