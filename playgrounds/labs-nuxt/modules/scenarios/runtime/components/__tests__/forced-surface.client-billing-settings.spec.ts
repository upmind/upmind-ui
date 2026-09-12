// @vitest-environment happy-dom
import declaration from "../../../useBillingSettingsManager/client-billing-settings.scenario";
import { proveForcedSurface } from "./forced-surface.harness";
// -----------------------------------------------------------------------------
await proveForcedSurface(declaration);
