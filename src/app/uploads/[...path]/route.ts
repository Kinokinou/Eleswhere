import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadServerEnv } from "@/server/env";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { path: requestedPath } = await context.params;
  const env = loadServerEnv();
  const filePath = path.resolve(env.uploadDir, ...requestedPath);
  const uploadRoot = path.resolve(env.uploadDir);

  if (!filePath.startsWith(uploadRoot)) {
    return Response.json({ message: "非法文件路径" }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        "content-type": getContentType(filePath),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ message: "文件不存在" }, { status: 404 });
  }
}

function getContentType(filePath: string) {
  return filePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}
