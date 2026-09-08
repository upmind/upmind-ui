/**
 * @module foundation/routing
 * @description The funnel/route socket: ADR 023 §7, §8.
 */
import type { Router } from "vue-router";

/** A package's flow contribution: given the app's router, register its funnels. */
export type FlowRegistrar = (engine: Router) => void;
