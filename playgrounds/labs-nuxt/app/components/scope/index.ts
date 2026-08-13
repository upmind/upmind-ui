// -----------------------------------------------------------------------------
/**
 * @module components/scope
 * @description Scope is global chrome (`G9`): the `ScopeBar` cluster and the
 * three segments it groups (`G11`), plus the composables that back them.
 *
 * The three raw "type an ID" popovers this replaced — `BrandScopeSelector`,
 * `ActorScopeSelector`, `ContextScopeSelector` — and the `ImpersonationBar` are
 * gone (`AC1.1`, `F5 CORRECTED`); their mechanisms live on in the segments and
 * in `useActorScopeSelector`, which the segments and the `useAuth` scenario page
 * both consume.
 */

export { default as ActingForSegment } from "./ActingForSegment.vue";
export { default as BrandSegment } from "./BrandSegment.vue";
export { default as ScopeBar } from "./ScopeBar.vue";
export { default as SessionSwitcher } from "./SessionSwitcher.vue";
export * from "./useActorScopeSelector";
export * from "./useContextScopeSelector";
