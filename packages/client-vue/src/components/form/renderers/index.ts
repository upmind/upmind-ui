import { registerEntry } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";
import SLDRenderer, { tester as sldTest } from "./SLDRenderer.vue";
import AddressRenderer, { tester as addressTest } from "./AddressRenderer.vue";
import ModelListRenderer, {
  tester as modelListTest,
} from "./ModelRenderer/ModelListRenderer.vue";
import { ModelRenderer, modelTest } from "./ModelRenderer";
// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(ModelListRenderer, modelListTest),
  registerEntry(ModelRenderer, modelTest),
];
