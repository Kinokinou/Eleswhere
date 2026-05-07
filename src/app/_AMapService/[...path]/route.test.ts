import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /_AMapService/*", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("缺少 AMAP_JS_SECURITY_CODE 时返回中文错误", async () => {
    vi.stubEnv("AMAP_JS_SECURITY_CODE", "");

    const response = await GET(
      new Request("http://localhost/_AMapService/v3/place/text?keywords=cafe"),
      { params: Promise.resolve({ path: ["v3", "place", "text"] }) },
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("缺少 AMAP_JS_SECURITY_CODE，无法代理高德 JS API 请求");
  });

  it("给 Web 服务代理请求追加 jscode", async () => {
    vi.stubEnv("AMAP_JS_SECURITY_CODE", "security-code");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/_AMapService/v3/place/text?keywords=cafe"),
      { params: Promise.resolve({ path: ["v3", "place", "text"] }) },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://restapi.amap.com/v3/place/text?keywords=cafe&jscode=security-code",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
