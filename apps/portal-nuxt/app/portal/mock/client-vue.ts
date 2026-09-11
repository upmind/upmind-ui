// -----------------------------------------------------------------------------
/**
 * @module portal/mock/client-vue
 * @description The one sentence a stub speaks where `@upmind-automation/client-vue`
 * already ships the surface — a leaf, so the dispatcher and the page configs
 * say it the same way.
 */

export const CLIENT_VUE_STUB_TITLE = "Provided by client-vue";

/** Names the component and the headless module it rides. */
export function clientVueProse(component: string, module: string): string {
  return `\`${component}\` over headless \`${module}\`. Not mocked in this sandbox — see docs/client-vue-adoption.md.`;
}
