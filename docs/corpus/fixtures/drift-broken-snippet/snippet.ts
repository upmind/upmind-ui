// Negative-control snippet for gate:examples (FE-2752 bdd B7 / 2753-AC1, 2753-AC4).
//
// It imports a member that does NOT exist on the real @upmind-automation/headless
// package, so a `vue-tsc --noEmit` pass materialized against the real workspace
// packages must fail (TS2305 / TS2614 "has no exported member"). The selftest
// injects this snippet as a corpus `examples` entry, runs gate:examples, and
// asserts the gate REDs naming the example id and the missing export — proving the
// gate type-checks against reality rather than rubber-stamping the snippet.
import { __upmind_fe2752_nonexistent_export__ } from "@upmind-automation/headless";

const proof: number = __upmind_fe2752_nonexistent_export__;
export { proof };
