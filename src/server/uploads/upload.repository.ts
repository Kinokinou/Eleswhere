import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDirectory(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function writeUploadFile(filePath: string, bytes: Buffer) {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, bytes);
}
