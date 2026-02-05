import { createQueryClient, getQueryClient } from "./client";

describe("createQueryClient", () => {
  it("should create a new QueryClient instance", () => {
    const client = createQueryClient();
    expect(client).toBeDefined();
    expect(typeof client.getQueryCache).toBe("function");
  });

  it("should configure default query options", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(60 * 1000);
    expect(defaults.queries?.gcTime).toBe(5 * 60 * 1000);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it("should configure default mutation options", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.mutations?.retry).toBe(0);
  });
});

describe("getQueryClient", () => {
  beforeEach(() => {
    // Reset module state between tests
    jest.resetModules();
  });

  it("should return a QueryClient instance", () => {
    const client = getQueryClient();
    expect(client).toBeDefined();
    expect(typeof client.getQueryCache).toBe("function");
  });

  it("should return the same instance on subsequent calls in browser", async () => {
    // Re-import to get fresh module
    const { getQueryClient: getClient } = await import("./client");

    const client1 = getClient();
    const client2 = getClient();

    expect(client1).toBe(client2);
  });
});
