/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10) — no `MetaPanel`
 * node exists in the tree; these are minted for the runtime's debug panel.
 */

/** One evaluated flag off `ModuleDescriptor.snapshot.meta`. */
export type MetaPanelItem = {
  key: string;
  value: boolean;
};

export type MetaPanelProps = {
  /** The already-evaluated flags off `ModuleDescriptor.snapshot.meta`. */
  meta: Record<string, boolean>;
};
