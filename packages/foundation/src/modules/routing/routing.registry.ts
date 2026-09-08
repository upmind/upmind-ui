/**
 * @internal
 * The route and flow registries of ADR 023 §2's registry-ownership invariant:
 * both ship EMPTY and every entry arrives from a contributing package's own
 * `feature.ts`. An entry declared here would make `foundation` import a domain
 * package, and since every domain package imports `foundation`, that is a typed
 * cycle.
 */
import { shallowRef } from "vue";
import type { FlowRegistrar } from "./routing.types";
import type { RouteRecordRaw } from "vue-router";

export const routeRecords = shallowRef<RouteRecordRaw[]>([]);

export const flowRegistrars = shallowRef<FlowRegistrar[]>([]);

export function addRoutes(added: RouteRecordRaw[]): void {
  routeRecords.value = routeRecords.value.concat(added);
}

export function registerFlows(register: FlowRegistrar): void {
  flowRegistrars.value = flowRegistrars.value.concat(register);
}

export function clearRouting(): void {
  routeRecords.value = [];
  flowRegistrars.value = [];
}
