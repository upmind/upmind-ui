// -----------------------------------------------------------------------------
/**
 * @module tests/support/logged-out-host
 * @description Mounts ONE logged-out page file against a query and records
 * what it handed its page host. The token screens pick their position from
 * the link they were opened with, so the link has to be real for the choice
 * to be — a described query proves the description, not the page.
 */

import { mount } from "@vue/test-utils";
import { vi } from "vitest";
import { defineComponent } from "vue";
import type { Mock } from "vitest";
import type { Component } from "vue";

export type HostedPage = {
  readonly pageKeys: unknown;
  readonly routeContext: unknown;
  readonly navigateTo: Mock;
};

/** Installs the Nuxt globals a page file reaches for; call from `beforeEach`. */
export function stubPageGlobals(query: Record<string, string> = {}): void {
  Object.assign(globalThis, {
    useRoute: () => ({ path: "/", query }),
    definePageMeta: () => undefined,
    navigateTo: vi.fn()
  });
}

export function clearPageGlobals(): void {
  for (const name of ["useRoute", "definePageMeta", "navigateTo"]) {
    Reflect.deleteProperty(globalThis, name);
  }
}

export async function hostedAt(
  load: () => Promise<{ default: Component }>,
  query: Record<string, string> = {}
): Promise<HostedPage> {
  const seen: { pageKeys: unknown; routeContext: unknown }[] = [];
  const navigateTo = vi.fn();
  const recorder = defineComponent({
    name: "PortalPageHost",
    props: {
      pageKeys: { type: Array, default: undefined },
      routeContext: { type: Object, default: undefined }
    },
    setup(props) {
      seen.push({ pageKeys: props.pageKeys, routeContext: props.routeContext });
      return () => undefined;
    }
  });

  Object.assign(globalThis, {
    useRoute: () => ({ path: "/", query }),
    definePageMeta: () => undefined,
    navigateTo
  });

  const page = await load();
  mount(page.default, { global: { stubs: { PortalPageHost: recorder } } });

  const [recorded] = seen;
  if (recorded === undefined) {
    throw new Error("the page seated no page host at all");
  }
  return { ...recorded, navigateTo };
}
