import { describe, it, expect, vi, beforeEach } from "vitest";
// NB: ./mocks must be imported BEFORE module under test
import "./mocks";
import { useLocale } from "../../system";
import { useQuery } from "../useQuery";

describe("useQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query", () => {
    it("triggers a refetch after locale changes", async () => {
      const { query } = useQuery();

      const response = query({
        url: new URL("https://api.test/ping"),
        queryKey: ["query", "locale"]
      });

      // assert: initial refetch not called
      expect(response.refetch).not.toHaveBeenCalled();

      // change locale
      await useLocale().setLocale("fr");

      // assert: refetch called once due to locale change
      expect(response.refetch).toHaveBeenCalledOnce();
    });
  });

  describe("list", () => {
    it("triggers a refetch after locale changes", async () => {
      const { list } = useQuery();

      const response = list({
        url: new URL("https://api.test/ping"),
        queryKey: ["list", "locale"]
      });

      // assert: initial refetch not called
      expect(response.refetch).not.toHaveBeenCalled();

      // change locale
      await useLocale().setLocale("fr");

      // assert: refetch called once due to locale change
      expect(response.refetch).toHaveBeenCalledOnce();
    });
  });
});
