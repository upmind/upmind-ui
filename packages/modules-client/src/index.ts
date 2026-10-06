// -----------------------------------------------------------------------------
/**
 * @module client
 * @description The `client` box: its manage rows and form renderers.
 */
import { registerFormRenderers } from "@upmind-automation/foundation";
import { clientRenderers } from "./renderers";
// -----------------------------------------------------------------------------

registerFormRenderers(clientRenderers);

// --- Export the renderer entries
export { clientRenderers } from "./renderers";

// --- Export the manage rows
export { AddressItem, CompanyItem, PhoneItem } from "./rows";
