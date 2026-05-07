import { z } from "zod";

export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
export const allowedUploadMimeTypes = ["image/jpeg", "image/png"] as const;

export const uploadFileMetaSchema = z.object({
  name: z.string().min(1, "文件名不能为空"),
  type: z.enum(allowedUploadMimeTypes, {
    message: "仅支持 JPG/JPEG/PNG 图片",
  }),
  size: z
    .number()
    .int()
    .positive("文件大小必须大于 0")
    .max(MAX_UPLOAD_FILE_SIZE, "单张照片不能超过 10MB"),
});

export function validateUploadFileMeta(input: unknown) {
  return uploadFileMetaSchema.safeParse(input);
}
