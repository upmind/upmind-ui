import AddressRenderer from "./AddressRenderer.vue";
import { tester as addressTest } from "./AddressRenderer.vue";
import DomainRenderer from "./DomainRenderer.vue";
import { tester as domainTest } from "./DomainRenderer.vue";
import FilterBarRenderer from "./FilterBarRenderer.vue";
import { tester as filterBarTest } from "./FilterBarRenderer.vue";
import FilterButtonGroupRenderer from "./FilterButtonGroupRenderer.vue";
import { tester as filterButtonGroupTest } from "./FilterButtonGroupRenderer.vue";
import FilterRangeRenderer from "./FilterRangeRenderer.vue";
import { tester as filterRangeTest } from "./FilterRangeRenderer.vue";
import FilterSearchRenderer from "./FilterSearchRenderer.vue";
import { tester as filterSearchTest } from "./FilterSearchRenderer.vue";
import FilterToggleGroupRenderer from "./FilterToggleGroupRenderer.vue";
import { tester as filterToggleGroupTest } from "./FilterToggleGroupRenderer.vue";
import GatewaysRenderer from "./GatewaysRenderer.vue";
import { tester as gatewayMethodTest } from "./GatewaysRenderer.vue";
import ImageRenderer from "./ImageRenderer.vue";
import { tester as imageTest } from "./ImageRenderer.vue";
import ManageRenderer from "./ManageRenderer.vue";
import { tester as manageTest } from "./ManageRenderer.vue";
import PaymentDetailsRenderer from "./PaymentDetailsRenderer.vue";
import { tester as paymentMethodTest } from "./PaymentDetailsRenderer.vue";
import SLDRenderer from "./SLDRenderer.vue";
import { tester as sldTest } from "./SLDRenderer.vue";
import SubProductRenderer from "./SubProductRenderer.vue";
import { tester as subProductTest } from "./SubProductRenderer.vue";
import TermsRenderer from "./TermsRenderer.vue";
// -----------------------------------------------------------------------------
import { tester as termsTest } from "./TermsRenderer.vue";
import { registerEntry } from "../engine/renderers/utils";

// -----------------------------------------------------------------------------

export const formRenderers = [
  registerEntry(DomainRenderer, domainTest),
  registerEntry(SLDRenderer, sldTest),
  registerEntry(AddressRenderer, addressTest),
  registerEntry(ImageRenderer, imageTest),
  registerEntry(ManageRenderer, manageTest),
  registerEntry(PaymentDetailsRenderer, paymentMethodTest),
  registerEntry(GatewaysRenderer, gatewayMethodTest),
  registerEntry(TermsRenderer, termsTest),
  registerEntry(SubProductRenderer, subProductTest),
  registerEntry(FilterButtonGroupRenderer, filterButtonGroupTest),
  registerEntry(FilterToggleGroupRenderer, filterToggleGroupTest),
  registerEntry(FilterSearchRenderer, filterSearchTest),
  registerEntry(FilterRangeRenderer, filterRangeTest),
  registerEntry(FilterBarRenderer, filterBarTest)
];
