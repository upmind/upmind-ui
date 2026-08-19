import { registerEntry } from "@upmind-automation/upmind-ui";
import AddressRenderer, { tester as addressTest } from "./AddressRenderer.vue";
import DomainRenderer, { tester as domainTest } from "./DomainRenderer.vue";
import FilterBarRenderer, {
  tester as filterBarTest
} from "./FilterBarRenderer.vue";
import FilterButtonGroupRenderer, {
  tester as filterButtonGroupTest
} from "./FilterButtonGroupRenderer.vue";
import FilterRangeRenderer, {
  tester as filterRangeTest
} from "./FilterRangeRenderer.vue";
import FilterSearchRenderer, {
  tester as filterSearchTest
} from "./FilterSearchRenderer.vue";
import FilterToggleGroupRenderer, {
  tester as filterToggleGroupTest
} from "./FilterToggleGroupRenderer.vue";
import GatewaysRenderer, {
  tester as gatewayMethodTest
} from "./GatewaysRenderer.vue";
import ImageRenderer, { tester as imageTest } from "./ImageRenderer.vue";
import ManageRenderer, { tester as manageTest } from "./ManageRenderer.vue";
import PaymentDetailsRenderer, {
  tester as paymentMethodTest
} from "./PaymentDetailsRenderer.vue";
import SLDRenderer, { tester as sldTest } from "./SLDRenderer.vue";
import SubProductRenderer, {
  tester as subProductTest
} from "./SubProductRenderer.vue";
import TermsRenderer, { tester as termsTest } from "./TermsRenderer.vue";

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
