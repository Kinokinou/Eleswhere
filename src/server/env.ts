import path from "node:path";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "缺少 DATABASE_URL，请先配置数据库连接"),
  UPLOAD_DIR: z.string().min(1).default(path.join(process.cwd(), ".uploads")),
  NEXT_PUBLIC_UPLOAD_BASE_URL: z.string().min(1).default("/uploads"),
});

export type ServerEnv = {
  databaseUrl: string;
  uploadDir: string;
  uploadBaseUrl: string;
};

export function loadServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    UPLOAD_DIR: process.env.UPLOAD_DIR,
    NEXT_PUBLIC_UPLOAD_BASE_URL: process.env.NEXT_PUBLIC_UPLOAD_BASE_URL,
  });

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "服务端环境变量配置错误");
  }

  return {
    databaseUrl: result.data.DATABASE_URL,
    uploadDir: result.data.UPLOAD_DIR,
    uploadBaseUrl: result.data.NEXT_PUBLIC_UPLOAD_BASE_URL,
  };
}
