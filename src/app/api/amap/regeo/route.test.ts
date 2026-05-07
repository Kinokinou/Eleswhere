import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const request = (body: unknown) =>
  new Request("http://localhost/api/amap/regeo", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/amap/regeo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("缺少 AMAP_WEB_SERVICE_KEY 时返回中文错误", async () => {
    vi.stubEnv("AMAP_WEB_SERVICE_KEY", "");

    const response = await POST(
      request({ points: [{ id: "p1", lat: 22.1, lng: 113.5 }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("缺少 AMAP_WEB_SERVICE_KEY，无法调用高德逆地理编码");
  });

  it("拒绝非法坐标", async () => {
    vi.stubEnv("AMAP_WEB_SERVICE_KEY", "server-key");

    const response = await POST(
      request({ points: [{ id: "p1", lat: 200, lng: 113.5 }] }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.results[0]).toMatchObject({
      id: "p1",
      status: "skipped",
      message: "非法经纬度",
    });
  });

  it("调用高德后不把后端 key 返回给前端", async () => {
    vi.stubEnv("AMAP_WEB_SERVICE_KEY", "server-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "1",
          info: "OK",
          regeocode: {
            formatted_address: "广东省珠海市香洲区富祥湾",
            addressComponent: { city: "珠海市", district: "香洲区" },
            pois: [{ name: "珠海长隆海洋王国" }],
            aois: [],
          },
        }),
      }),
    );

    const response = await POST(
      request({ points: [{ id: "p1", lat: 22.1, lng: 113.5 }] }),
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("珠海长隆海洋王国");
    expect(text).not.toContain("server-key");
  });
});
