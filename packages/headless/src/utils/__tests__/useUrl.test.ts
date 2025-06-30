import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useUrl, useUrlParams, usePOP } from "../../utils";

// TODO: Perhaps we can move env variables to a constants file?
// We would then only have to mock the constants file as the dependency
vi.stubEnv("VITE_API_URL", "https://test.com");

// set our POP for these tests
const { isReady, getApiUrl } = usePOP({
  name: "test",
  apiUrl: "https://test.com",
  region: "test"
});

await isReady();

const mockParams = { foo: "bar" };

describe("useUrl.ts", () => {
  describe("useUrl", () => {
    it("should create URL correctly", () => {
      console.log("getApiUrl", getApiUrl());

      const url = useUrl("/test", mockParams);
      expect(url.toString()).toBe("https://test.com/api/test?foo=bar");
    });

    it("should use custom instance base URL and context", () => {
      const url = useUrl("/test", mockParams, {
        base: "https://custom.com",
        context: "v1"
      });
      expect(url.toString()).toBe("https://custom.com/v1/test?foo=bar");
    });

    it("should handle empty arguments correctly", () => {
      let url = useUrl("");
      expect(url.toString()).toBe("https://test.com/api/");
      url = useUrl("/test");
      expect(url.toString()).toBe("https://test.com/api/test");
    });

    it("should take care of trimming extra slashes", () => {
      const url = useUrl("/test/path");
      expect(url.toString()).toBe("https://test.com/api/test/path");

      // TODO?
      // url = useUrl('test/path/');
      // expect(url.toString()).toBe('https://test.com/api/test/path');
    });
  });

  describe("useUrlParams", () => {
    const { getParamFromUrl, syncParamToUrl } = useUrlParams();
    let location: Location;

    beforeEach(() => {
      location = window.location;
      window.location = undefined as any;
      window.location = {
        ...location,
        search: "",
        toString() {
          return this.href;
        }
      };

      vi.spyOn(window.history, "replaceState");
    });

    afterEach(() => {
      window.location = location;
      vi.clearAllMocks();
    });

    describe("getParamFromUrl", () => {
      it("should get parameter from URL", () => {
        window.location.search = "?foo=bar";
        expect(getParamFromUrl("foo")).toBe("bar");
      });

      it("should return null if parameter does not exist", () => {
        window.location.search = "";
        expect(getParamFromUrl("foo")).toBeNull();
      });
    });

    describe("syncParamToUrl", () => {
      it("should sync parameter to URL", () => {
        syncParamToUrl("foo", "bar");
        expect(window.history.replaceState).toHaveBeenCalled();
        // @ts-ignore
        const url = new URL(window.history.replaceState.mock.calls[0][2]);
        expect(url.searchParams.get("foo")).toBe("bar");
      });

      it("should remove parameter from URL if value is undefined", () => {
        window.location.search = "?foo=bar";
        syncParamToUrl("foo");
        expect(window.history.replaceState).toHaveBeenCalled();
        // @ts-ignore
        const url = new URL(window.history.replaceState.mock.calls[0][2]);
        expect(url.searchParams.get("foo")).toBeNull();
      });

      it("should handle null parameters and empty strings correctly", () => {
        // @ts-ignore
        expect(getParamFromUrl(null)).toBeNull();
        expect(getParamFromUrl("")).toBeNull();
        syncParamToUrl("");
        expect(window.history.replaceState).toHaveBeenCalled();
        // @ts-ignore
        const url = new URL(window.history.replaceState.mock.calls[0][2]);
        expect(url.searchParams.toString()).toBe("");
      });
    });
  });
});
