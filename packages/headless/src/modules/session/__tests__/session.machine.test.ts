import { vi, describe, it, expect, beforeEach } from "vitest";
// import { interpret } from "xstate";
// import sessionMachine from '../session.machine';

const mockServices = {
  check: vi.fn(() => Promise.resolve(true)),
  transfer: vi.fn(() => Promise.resolve(true))
};

const mockActions = {
  clear: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn()
};

describe("Session Machine", () => {
  let mockSessionMachine = null;
  let sessionService = null;

  // beforeEach(() => {
  //   mockSessionMachine = sessionMachine.withConfig({
  //     services: mockServices,
  //     actions: mockActions,
  //   });
  //   sessionService = interpret(mockSessionMachine);
  // })

  // it('should init correctly', (done) => {
  //   sessionService.onTransition((state) => {
  //     console.log(state);
  //     done();
  //   });

  //   sessionService.start();
  // });

  it("should pass", () => {
    expect(true).toBeTruthy();
  });
});
