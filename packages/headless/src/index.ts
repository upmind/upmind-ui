export { type QueryClient } from "@tanstack/vue-query";
export { Store } from "@tanstack/vue-store";
export * from "xstate";

// --- internal
export * from "./modules";
export * from "./utils";
// -----------------------------------------------------------------------------
// useUpmind constructs the Upmind singleton at import time (new Upmind() calls
// useQuery()), so it must evaluate AFTER ./modules has initialised the query
// module — keep these lines below the module exports.
export * from "./useUpmind";
export { default } from "./useUpmind";
