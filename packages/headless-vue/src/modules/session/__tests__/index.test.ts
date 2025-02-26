import { describe, it, expect, vi, beforeEach } from "vitest";
import { useActor } from "@xstate/vue";
import { useSession as useUpmindSession } from "@upmind-automation/headless";
import { useSession } from "../index";

// Mock useActor from @xstate/vue
vi.mock("@xstate/vue", () => ({
  useActor: vi.fn(),
}));

// Mock useDomain from @upmind-automation/headless
vi.mock("@upmind-automation/headless", () => ({
  useSession: vi.fn(() => ({
    session: {
      service: vi.fn(),
      transfer: vi.fn(),
    },
  })),
}));

describe("useSession", () => {
  let mockState: any;
  let send;
  // const token = ref(''); // TODO: Import { ref } from "vue";

  beforeEach(() => {
    mockState = {
      value: {
        value: "idle",
        context: {
          values: ["testing context value"],
          choices: [],
          type: "",
          available: [],
          error: null,
        },
        matches: vi.fn(state => state === "loading"),
      },
    };
    send = vi.fn();

    useActor.mockReturnValue({ state: mockState, send });

    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return the correct initial state", () => {
    const { state } = useSession();

    expect(useUpmindSession).toHaveBeenCalled();
    expect(useActor).toHaveBeenCalled();
    expect(state.value).toBe(mockState.value.value);
  });

  // it("should send LOGIN event", () => {
  //   const { showLogin } = useSession();
  //   showLogin();
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'LOGIN'
  //   });
  // });

  // it("should send REGISTER event using showRegister", () => {
  //   const { showRegister } = useDomain();
  //   showRegister();
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'REGISTER'
  //   });
  // });

  // it("should send AUTHENTICATE event", () => {
  //   const { login } = useDomain();
  //   const token = ref('');
  //   login({ token });
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'AUTHENTICATE',
  //     data: ''
  //   });
  // });

  // it("should send VERIFY event using verify2fa", () => {
  //   const { verify2fa } = useDomain();
  //   const token = ref('');
  //   verify2fa({ token });
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'VERIFY',
  //     data: ''
  //   });
  // });

  // it("should send REGISTER event using register", () => {
  //   const { register } = useDomain();
  //   const token = ref('');
  //   register({ token });
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'REGISTER',
  //     data: ''
  //   });
  // });

  // it("should send VERIFY event using verifyReCaptcha", () => {
  //   const { verifyReCaptcha } = useDomain();
  //   const token = ref('');
  //   register({ token });
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'VERIFY',
  //     data: ''
  //   });
  // });

  // it("should send LOGOUT event", () => {
  //   const { logout } = useSession();
  //   logout();
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'LOGOUT'
  //   });
  // });

  // TODO: Test `resolve` function

  // it("should send CANCEL event", () => {
  //   const { logout } = useSession();
  //   logout();
  //   expect(send).toHaveBeenCalledWith({
  //     type: 'LOGOUT'
  //   });
  // });

  // it("should return the correct meta state", () => {
  //   mockState.value.value = 'checking'
  //   useActor.mockReturnValue({ state: mockState, send });
  //   const { meta } = useDomain();
  //   expect(meta.value.isLoading).toBe(true);
  //   expect(meta.value.isProcessing).toBe(false);
  //   expect(meta.value.hasErrors).toBe(false);
  //   expect(meta.value.isAuthenticated).toBe(false);
  //   expect(meta.value.isTransferring).toBe(false);
  //   expect(meta.value.showReCaptcha).toBe(false);
  //   expect(meta.value.showLoginForm).toBe(false);
  //   expect(meta.value.show2fa).toBe(false);
  //   expect(meta.value.showRegisterForm).toBe(false);
  //   expect(meta.value.canShowForms).toBe(false);
  // });
});
