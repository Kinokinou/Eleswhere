import { afterEach, describe, expect, it, vi } from "vitest";
import { loadServerEnv } from "./env";

describe("loadServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("读取数据库和上传相关服务端环境变量", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://root:pw@localhost:5432/eleswhere");
    vi.stubEnv("UPLOAD_DIR", "D:/Eleswhere/.uploads");
    vi.stubEnv("NEXT_PUBLIC_UPLOAD_BASE_URL", "/uploads");

    expect(loadServerEnv()).toMatchObject({
      databaseUrl: "postgresql://root:pw@localhost:5432/eleswhere",
      uploadDir: "D:/Eleswhere/.uploads",
      uploadBaseUrl: "/uploads",
    });
  });

  it("缺少 DATABASE_URL 时返回中文配置错误", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("UPLOAD_DIR", "D:/Eleswhere/.uploads");
    vi.stubEnv("NEXT_PUBLIC_UPLOAD_BASE_URL", "/uploads");

    expect(() => loadServerEnv()).toThrow("缺少 DATABASE_URL，请先配置数据库连接");
  });
});
