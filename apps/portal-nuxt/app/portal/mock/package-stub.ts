// -----------------------------------------------------------------------------
/**
 * @module portal/mock/package-stub
 * @description The one sentence a stub speaks where a domain package
 * already ships the surface — a leaf, so the dispatcher and the page configs
 * say it the same way.
 */

export const PACKAGE_STUB_TITLE = "Provided by a domain package";

/** Names the component and the headless module it rides. */
export function packageStubProse(component: string, module: string): string {
  return `\`${component}\` over headless \`${module}\`. Not mocked in this sandbox — see docs/client-vue-adoption.md.`;
}
