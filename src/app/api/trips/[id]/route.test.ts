import { afterEach, describe, expect, it, vi } from "vitest";

const missingTripId = "11111111-1111-4111-8111-111111111111";

describe("GET /api/trips/[id]", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("找不到旅行时返回中文 404", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://root:lch20201710.@localhost:5432/eleswhere");
    vi.stubEnv("UPLOAD_DIR", "D:/Eleswhere/.uploads");
    vi.stubEnv("NEXT_PUBLIC_UPLOAD_BASE_URL", "/uploads");

    const { GET } = await import("./route");
    const response = await GET(new Request(`http://localhost/api/trips/${missingTripId}`), {
      params: Promise.resolve({ id: missingTripId }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe("旅行不存在");
  });
});
