/// <reference types="@types/google.maps" />

/**
 * This declaration file adds global type references needed by workspace packages
 * when type-checked as part of the Nuxt build.
 *
 * Why this is needed:
 * - Nuxt uses `moduleResolution: Bundler` and sets `types: []` (empty)
 * - Vue cart uses `moduleResolution: node` with project references
 * - Workspace packages define their own types in their tsconfigs, but Nuxt
 *   ignores those when resolving via path aliases
 *
 * The psl module issue is a known problem with the psl package's exports config
 * not working with Bundler resolution - we handle that with noImplicitAny workaround
 */

// Shim for psl module to avoid TS7016 errors with Bundler resolution
declare module "psl" {
  export interface ParsedDomain {
    tld: string | null;
    sld: string | null;
    domain: string | null;
    subdomain: string | null;
    listed: boolean;
    input: string;
    error?: { message: string; code: string };
  }

  export function parse(domain: string): ParsedDomain;
  export function get(domain: string): string | null;
  export function isValid(domain: string): boolean;
}
