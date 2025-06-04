import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";
import SLDRenderer, { tester as sldTest } from "./SLDRenderer.vue";
import AddressRenderer, { tester as addressTest } from "./AddressRenderer.vue";
import AddressListRenderer, {
  tester as addressListTest,
} from "./AddressListRenderer.vue";
import ModelRenderer, { tester as modelTest } from "./ModelRenderer.vue";
// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(AddressListRenderer, addressListTest),
  registerEntry(ModelRenderer, modelTest),
];
