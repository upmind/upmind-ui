import { setupDevToolsPlugin } from "@vue/devtools-api";
import { ScopeActorTypes } from "./scope.types";
import { forEach, isObject, keys, map, startsWith } from "lodash-es";
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
// The prefixes `generateScopeKey` stamps on every non-context segment.
const BRAND_PREFIX = "brand:";
const FRESH_PREFIX = "fresh:";
const RECORD_PREFIX = "id:";
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

        // Prefix-aware, never positional: a SELECTOR context contributes ONE
        // unprefixed segment and a RETARGET two, so a fixed position would
        // report a `brand:` or `id:` segment as the context id.
        const [name, actor, ...rest] = key.split(":");
        const contextParts: string[] = [];
        let recordId: string | undefined;
        let brandId: string | undefined;
        let seenPrefixed = false;

        forEach(rest, segment => {
          if (startsWith(segment, RECORD_PREFIX)) {
            seenPrefixed = true;
            recordId = segment.slice(RECORD_PREFIX.length);
          } else if (startsWith(segment, BRAND_PREFIX)) {
            seenPrefixed = true;
            brandId = segment.slice(BRAND_PREFIX.length);
          } else if (startsWith(segment, FRESH_PREFIX)) {
            seenPrefixed = true;
          } else if (!seenPrefixed) {
            contextParts.push(segment);
          }
        });

        const [contextType, contextId] = contextParts;

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
