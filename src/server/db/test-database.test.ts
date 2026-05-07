import { describe, expect, it } from "vitest";
import { assertSafeTestDatabaseUrl } from "./test-database";

describe("assertSafeTestDatabaseUrl", () => {
  it("拒绝把开发库 eleswhere 当成测试库清理", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "postgresql://root:pw@localhost:5432/eleswhere",
      ),
    ).toThrow("测试数据库名称必须以 _test 结尾");
  });

  it("允许清理明确的测试库", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "postgresql://root:pw@localhost:5432/eleswhere_test",
      ),
    ).not.toThrow();
  });
});
