// -----------------------------------------------------------------------------
/**
 * @module client/renderers
 * @description The address and manage form renderers this package registers.
 */
import { registerEntry } from "@upmind/ui";
import AddressRenderer from "./AddressRenderer.vue";
import { tester as addressTester } from "./AddressRenderer.vue";
import ManageRenderer from "./ManageRenderer.vue";
import { tester as manageTester } from "./ManageRenderer.vue";
import type { FormRendererEntry } from "@upmind-automation/foundation";

export const clientRenderers: FormRendererEntry[] = [
  registerEntry(AddressRenderer, addressTester),
  registerEntry(ManageRenderer, manageTester)
];
