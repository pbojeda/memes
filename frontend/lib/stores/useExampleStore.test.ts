import { useExampleStore } from "./useExampleStore";

describe("useExampleStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useExampleStore.setState({ count: 0 });
  });

  describe("initial state", () => {
    it("should have count initialized to 0", () => {
      const { count } = useExampleStore.getState();
      expect(count).toBe(0);
    });
  });

  describe("increment", () => {
    it("should increment count by 1", () => {
      const { increment } = useExampleStore.getState();
      increment();
      expect(useExampleStore.getState().count).toBe(1);
    });

    it("should increment multiple times", () => {
      const { increment } = useExampleStore.getState();
      increment();
      increment();
      increment();
      expect(useExampleStore.getState().count).toBe(3);
    });
  });

  describe("decrement", () => {
    it("should decrement count by 1", () => {
      useExampleStore.setState({ count: 5 });
      const { decrement } = useExampleStore.getState();
      decrement();
      expect(useExampleStore.getState().count).toBe(4);
    });

    it("should allow negative numbers", () => {
      const { decrement } = useExampleStore.getState();
      decrement();
      expect(useExampleStore.getState().count).toBe(-1);
    });
  });

  describe("reset", () => {
    it("should reset count to 0", () => {
      useExampleStore.setState({ count: 100 });
      const { reset } = useExampleStore.getState();
      reset();
      expect(useExampleStore.getState().count).toBe(0);
    });
  });
});
