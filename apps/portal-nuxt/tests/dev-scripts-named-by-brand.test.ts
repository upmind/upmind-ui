import { describe, expect, it } from "vitest";
import { PORTAL_CONFIGS, isPortalConfigId } from "~/portal/config";

/**
 * Each `dev:<brand>` script boots one shape on its own port, and its NAME is
 * the brand it comes up wearing. That is only useful while it stays true: a
 * config re-themed without renaming its script leaves `pnpm dev:hostgrid`
 * serving something else, and nothing else in the tree would notice.
 *
 * Read straight off package.json and the shipped configs — never a list
 * restated here, which would just be the same claim written twice.
 */
const SCRIPTS = (
  await import("../package.json?raw").then(m => JSON.parse(m.default))
).scripts as Record<string, string>;

const devShapeScripts = Object.entries(SCRIPTS).filter(([name]) =>
  /^dev:/.test(name)
);

function pinnedConfigId(command: string): string | undefined {
  return /NUXT_PUBLIC_PORTAL_CONFIG=([\w-]+)/.exec(command)?.[1];
}

function pinnedPort(command: string): string | undefined {
  return /--port\s+(\d+)/.exec(command)?.[1];
}

describe("dev scripts — each is named for the brand it boots", () => {
  it("ships one per shape, so no shape is unreachable", () => {
    expect(devShapeScripts.length).toBe(Object.keys(PORTAL_CONFIGS).length);
  });

  it.each(devShapeScripts)("%s pins a real shape", (_name, command) => {
    const id = pinnedConfigId(command);
    expect(id).toBeDefined();
    expect(isPortalConfigId(id)).toBe(true);
  });

  it.each(devShapeScripts)(
    "%s boots the brand its name claims",
    (name, command) => {
      const id = pinnedConfigId(command);
      const brand = name.replace(/^dev:/, "");

      expect(isPortalConfigId(id)).toBe(true);
      // the RESOLVED theme of the shape it pins, not the script's own text
      expect(PORTAL_CONFIGS[id as never].theme).toBe(brand);
    }
  );

  it("gives every script its own port, so two can run side by side", () => {
    const ports = devShapeScripts.map(([, command]) => pinnedPort(command));
    expect(ports.every(Boolean)).toBe(true);
    expect(new Set(ports).size).toBe(ports.length);
  });

  it("pins a different shape in every script", () => {
    const ids = devShapeScripts.map(([, command]) => pinnedConfigId(command));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
