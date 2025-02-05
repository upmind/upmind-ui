import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import brandMachine from "@/modules/brand/brand.machine";

const mockServices = {
  fetchOrganisationConfig: vi.fn(() => Promise.resolve(true)),
  fetchBrandConfig: vi.fn(() => Promise.resolve(true)),
  fetchBrandSettings: vi.fn(() => Promise.resolve(true)),
  fetchModules: vi.fn(() => Promise.resolve(true)),
};

const mockActions = {
  setOrganisation: vi.fn(),
  setConfig: vi.fn(),
  setConfigKeys: vi.fn(),
  setSettings: vi.fn(),
  setModules: vi.fn(),
};

describe("Brand Machine", async () => {
  let mockbrandMachine = null;
  let brandService: any = null;

  beforeEach(() => {
    mockbrandMachine = brandMachine.withConfig({
      services: mockServices,
      actions: mockActions,
    });
    brandService = interpret(mockbrandMachine);
  });

  afterEach(() => {
    brandService.stop();
    vi.clearAllMocks();
  });

  it("should init correctly", () =>
    new Promise((done: any) => {
      brandService.onTransition((state: any) => {
        expect(
          state.matches({
            processing: {
              organisation: "loading",
              config: "loading",
              settings: "loading",
              modules: "loading",
            },
          })
        ).toBeTruthy();
        expect(mockServices.fetchOrganisationConfig).toHaveBeenCalledOnce();
        expect(mockServices.fetchBrandConfig).toHaveBeenCalledOnce();
        expect(mockServices.fetchBrandSettings).toHaveBeenCalledOnce();
        expect(mockServices.fetchModules).toHaveBeenCalledOnce();

        brandService.stop();
        done();
      });

      brandService.start();
    }));

  it("should reach `complete` state", async () => {
    brandService.start();
    await waitFor(brandService, state => state.matches("complete"));

    expect(mockActions.setOrganisation).toHaveBeenCalledOnce();
    expect(mockActions.setConfig).toHaveBeenCalledOnce();
    expect(mockActions.setSettings).toHaveBeenCalledOnce();
    expect(mockActions.setModules).toHaveBeenCalledOnce();

    expect(brandService.state.matches("complete")).toBeTruthy();
  });

  it("should handle `CONFIG.GET` event", async () => {
    brandService.start();
    await waitFor(brandService, state => state.matches("complete"));

    brandService.send({ type: "CONFIG.GET" });
    await waitFor(brandService, state => state.matches("complete"));

    expect(mockActions.setConfigKeys).toHaveBeenCalledOnce();
  });

  it("should go to `error` state", async () => {
    const expectedState = {
      processing: {
        organisation: "error",
        config: "error",
        settings: "error",
        modules: "error",
      },
    };
    mockServices.fetchOrganisationConfig.mockRejectedValue(false);
    mockServices.fetchBrandConfig.mockRejectedValue(false);
    mockServices.fetchBrandSettings.mockRejectedValue(false);
    mockServices.fetchModules.mockRejectedValue(false);

    brandService.start();
    await waitFor(brandService, state => state.matches(expectedState));

    brandService.onTransition((state: any) => {
      brandService.stop();

      expect(mockServices.fetchOrganisationConfig).toHaveBeenCalled();
      expect(mockServices.fetchBrandConfig).toHaveBeenCalled();
      expect(mockServices.fetchBrandSettings).toHaveBeenCalled();
      expect(mockServices.fetchModules).toHaveBeenCalled();

      expect(state.matches(expectedState)).toBeTruthy();
    });
  });

  it("should `RETRY` after `error` state", async () => {
    let expectedState = {
      processing: {
        organisation: "error",
        config: "error",
        settings: "error",
        modules: "error",
      },
    };
    mockServices.fetchOrganisationConfig.mockRejectedValue(false);
    mockServices.fetchBrandConfig.mockRejectedValue(false);
    mockServices.fetchBrandSettings.mockRejectedValue(false);
    mockServices.fetchModules.mockRejectedValue(false);

    brandService.start();
    await waitFor(brandService, state => state.matches(expectedState));

    expectedState = {
      processing: {
        organisation: "loading",
        config: "loading",
        settings: "loading",
        modules: "loading",
      },
    };

    // clear mocks so we can be sure that services are called
    // correctly on RETRY event
    vi.clearAllMocks();

    brandService.send({ type: "RETRY" });
    await waitFor(brandService, state => state.matches(expectedState));

    expect(mockServices.fetchOrganisationConfig).toHaveBeenCalledOnce();
    expect(mockServices.fetchBrandConfig).toHaveBeenCalledOnce();
    expect(mockServices.fetchBrandSettings).toHaveBeenCalledOnce();
    expect(mockServices.fetchModules).toHaveBeenCalledOnce();

    // because the service wasn't stopped but the mocks were cleared
    // we should be able to expect the `RETRY` to have worked and
    // therefore the machine should be on state `complete`
    expect(brandService.state.matches("complete"));
  });
});
