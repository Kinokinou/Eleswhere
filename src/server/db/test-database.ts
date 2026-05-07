export function assertSafeTestDatabaseUrl(databaseUrl: string) {
  const databaseName = getDatabaseName(databaseUrl);

  // 关键逻辑：任何会清空表的测试都必须指向独立测试库，避免误删开发数据。
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `测试数据库名称必须以 _test 结尾，当前数据库为 ${databaseName}`,
    );
  }
}

function getDatabaseName(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    throw new Error("测试数据库连接格式错误");
  }
}
