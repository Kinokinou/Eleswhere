import path from "node:path";
import { randomUUID } from "node:crypto";
import { loadServerEnv } from "@/server/env";
import { writeUploadFile } from "./upload.repository";
import { validateUploadFileMeta } from "./upload.schema";

export type UploadedPhotoResult = {
  clientId: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
};

export async function saveUploadedPhoto(input: {
  clientId: string;
  file: File;
}): Promise<UploadedPhotoResult> {
  const validation = validateUploadFileMeta({
    name: input.file.name,
    type: input.file.type,
    size: input.file.size,
  });

  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message ?? "照片上传参数错误");
  }

  const env = loadServerEnv();
  const now = new Date();
  const monthPath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ext = input.file.type === "image/png" ? ".png" : ".jpg";
  const fileName = `${randomUUID()}${ext}`;
  const storagePath = path.join(env.uploadDir, "photos", monthPath, fileName);
  const publicUrl = `${env.uploadBaseUrl}/photos/${monthPath}/${fileName}`.replaceAll("\\", "/");

  // 关键逻辑：数据库只保存文件路径，图片二进制落盘，避免数据库和 localStorage 膨胀。
  const bytes = Buffer.from(await input.file.arrayBuffer());
  await writeUploadFile(storagePath, bytes);

  return {
    clientId: input.clientId,
    fileName,
    originalName: input.file.name,
    storagePath,
    publicUrl,
    mimeType: input.file.type,
    fileSize: input.file.size,
  };
}
